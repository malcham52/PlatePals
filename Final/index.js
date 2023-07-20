// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const pg = require('pg');
const bcrypt = require('bcrypt');
const port = process.env.PORT || 3000
// Middleware to check and see if a user is logged in before loading page
const {isLoggedIn, isLoggedOut} = require('./helpers/middleware')

// // Configure the Postgres database
const pool = new pg.Pool({
  user: "", //insert database username
  password: "",//insert database password
  database: "",//insert database name
  host: "",//insert database host link
  port: "",//insert port number
});

// Create an Express app
const app = express();

// Configure the app
app.use(express.static("public"))
//ensures the server side can render dynamic web pages and sets the view engine to EJS
app.set('view engine', 'ejs');
app.set('views', './views');

//secret option sets the session key, which will be a random string 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'your_session_secret',
    resave: true,
    saveUninitialized: true
}));

// Define the routes
// Base url route
app.get('/', (req, res) => {
    if (req.session.user) {
        res.redirect('/profile')
    }else {
        // User Ranking query
        let userRankingsQuery = `
        SELECT P.user_id, l.fname || ' ' || l.lname as name, count(entry_id) 
        FROM "Plate".posting as p
        JOIN "Plate".login3 as l 
        ON (p.user_id = l.user_id)
        GROUP BY P.user_id, l.fname || ' ' || l.lname
        ORDER BY count(entry_id) desc
        LIMIT 4
    `
        Promise.all([
            pool.query(userRankingsQuery),
        ])
        // if query works: render home page and pass in user rankings
        .then(function(resultsArray){
            // console.log(resultsArray[0].rows)
            res.render('home.ejs', { 
                rankings: resultsArray[0].rows
            });
        })
    }
});

// Home route
app.get('/home', isLoggedOut, (req, res) => {
    // User Ranking query
    let userRankingsQuery = `
    SELECT P.user_id, l.fname || ' ' || l.lname as name, count(entry_id) 
    FROM "Plate".posting as p
    JOIN "Plate".login3 as l 
    ON (p.user_id = l.user_id)
    GROUP BY P.user_id, l.fname || ' ' || l.lname
    ORDER BY count(entry_id) desc
    LIMIT 4
`
    Promise.all([
        pool.query(userRankingsQuery),
    ])
     // if query works: render home page and pass in user rankings
    .then(function(resultsArray){
        // console.log(resultsArray[0].rows)
        res.render('home.ejs', { 
            rankings: resultsArray[0].rows
        });
    })
});

// Test route for the form test files
// app.get('/formtest', (req, res) => {
//     res.render('formtest.ejs');
// });

// About page route
app.get('/about', isLoggedIn, (req, res) => {
    res.render('about.ejs');
});

// Competition page route
app.get('/competition', isLoggedIn, (req, res) => {
    if(!req.session.user) {
        res.redirect('/login')
    }
    // User Ranking query
    let userRankingsQuery = `
        SELECT P.user_id, l.fname || ' ' || l.lname as name, count(entry_id) 
        FROM "Plate".posting as p
        JOIN "Plate".login3 as l 
        ON (p.user_id = l.user_id)
        GROUP BY P.user_id, l.fname || ' ' || l.lname
        ORDER BY count(entry_id) desc
        LIMIT 4
    `
    // Recent Spotting query
    let recentSpottingsQuery = `
        SELECT 
          p.user_id, 
          l.fname || ' ' || l.lname as name, 
          to_char(date, 'mm/dd') as adate
        FROM "Plate".posting as p
        JOIN "Plate".login3 as l 
        ON (p.user_id = l.user_id)
        ORDER BY date desc
        limit 4
    `
    // State ranking query
    let stateRankingsQuery = `
        SELECT 
            plate_seen as state,
            count(*)::text as count
        FROM "Plate".posting as p
        GROUP BY plate_seen
        ORDER BY count(*) desc
        limit 4
    `
    // run 3 queries in parallel against the db server
    Promise.all([
        pool.query(userRankingsQuery),
        pool.query(recentSpottingsQuery),
        pool.query(stateRankingsQuery)
    ])
    // if queries work: pass data to competition.ejs
    .then(function(resultsArray){
        // console.log(resultsArray[0].rows, resultsArray[1].rows)
        res.render('competition.ejs', { 
            rankings: resultsArray[0].rows,
            spottings: resultsArray[1].rows,
            state: resultsArray[2].rows
        });
    })
    // if queries don't work, redirect to home page
    .catch(err => {
        console.log(err);
        res.redirect('/');
    })
});

// Contact page route
app.get('/contact', isLoggedIn, (req, res) => {
    res.render('contact.ejs');
});

// Confirmation page for contact submittal
app.post('/contactconfirm', isLoggedIn, (req, res) => {
    // consoles the inputs that were given on the contact page
    // console.log(req.body)
    let name = req.body.c_name
    let phone = req.body.c_phone
    let email = req.body.c_email
    let comment = req.body.c_comment
    // Inserts comment page inputs into database
    pool.query('INSERT INTO "Plate".Contact_Us (c_name, c_phone, c_email, c_comment) Values ($1, $2, $3, $4);', [name, phone, email, comment], (err, result) => {
        if (err) {
            console.log(err);
            res.redirect('/contact');
        } else {
            res.render('contactconfirm.ejs');
        }
    });
});

// Sign up page route
app.get('/signup', isLoggedOut, (req, res) => {
    res.render('signup.ejs');
});

// Confirmation page for signup
app.post('/signupconfirm', isLoggedOut, (req, res) => {
// consoles the inputs that were given on the signup page
// console.log(req.body)
let pass = req.body.password
let email = req.body.email
let fname = req.body.fname
let lname = req.body.lname
// encrypts the plain text password by using salt and hash - inserts hash into database instead of password given
bcrypt.hash(pass, 10, function(err,hash) {
pool.query('INSERT INTO "Plate"."login3"(password, email, fname, lname)Values ($1, $2, $3, $4);', [hash, email, fname, lname], (err, result) => {
    if (err) {
        console.log(err);
        res.redirect('/signup');
    } else {
        res.render('signupconfirm.ejs');;
    }
})});
});

// display the login form (login.ejs)
app.get('/login', isLoggedOut, (req, res) => {
    res.render('login.ejs')
});

// handle the login form data that is submitted
app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const error = "Incorrect Login entered"
    pool.query('SELECT * FROM "Plate".login3 WHERE email = $1', [email], (err, result) => {
    if (err || result.rows.length == 0) {
        console.error(error)
        res.redirect('/login');
        return;
    }
    if (result.rows.length > 0) {
        const user = result.rows[0];
        // console.log(user)
        bcrypt.compare(password, user.password, function (err, result) {
        if (err) {
            console.error(error)
            res.redirect('/login');
            return;
        }
        else if (result) {
            req.session.user = user;
            res.redirect('/profile');
        } else {
            console.error(error)
            res.redirect('/login');
        }
        })
    };
    });
});

// Logout Page route - ends the user's logged in session
app.get('/logout', isLoggedIn, (req, res) => {
    req.session.destroy((err) => {
        res.render('logout.ejs');
    });
});

// Profile page route
app.get('/profile', isLoggedIn, (req, res) => {
        let user_id = req.session.user.user_id
        // Grabs the latest 5 Post entries made by the user
        pool.query('SELECT * FROM "Plate".posting WHERE user_id = $1 ORDER BY date DESC LIMIT 5', [user_id], (err, result) => {
            if (err) {
                console.log(err);
                res.redirect('/login');
            } else {
                // console.log(result.rows)
                // Nested query to grab the total number of posts made by the user
                pool.query('SELECT COUNT (*) FROM "Plate".posting WHERE user_id = $1;', [user_id], (err, result2) =>{
                    if (err) {
                        console.log(err);
                        res.redirect('/login');
                    } else {
                        // console.log(result2.rows)
                        // Nest query to grab the most seen state by user
                        pool.query('SELECT COUNT (*), plate_seen FROM "Plate".posting WHERE user_id = $1 GROUP BY plate_seen ORDER BY COUNT(*) DESC', [user_id], (err, result3) =>{
                            if (err) {
                                console.log(err);
                                res.redirect('/login');
                            } else {
                            res.render('profile.ejs', { user: req.session.user, results: result.rows, total: result2.rows, seen: result3.rows });
                        }})
                }})
        }})
});

// Old Delete page code
// //Deleting the post entry by the user
// app.delete('/profile/:id', isLoggedIn, (req, res) => {
//         let user_id = req.session.user.user_id;
//         let post_id = req.params.id;
//         pool.query('DELETE FROM "Plate".posting WHERE user_id = $1 AND post_id = $2', [user_id, post_id], (err, result) => {
//             if (err) {
//                 console.log(err);
//                 res.status(err).send('Error, post unable to delete');
//             } else {
//                 res.status(err).send('Post has been deleted');
//             }
//         })
// });

// Post page route
app.get('/post', isLoggedIn, (req, res) => {
    res.render('post.ejs');
});

// Confirmation of posting page
app.post('/postconfirm', isLoggedIn, (req, res) => {
    // consoles the inputs that were given on the post page
    // console.log(req.body)
    let seen = req.body.plate_seen
    let observe = req.body.state_observed
    let date = req.body.date
    let comment = req.body.comment
    let user_id = req.session.user.user_id
    // Query to insert post page information into database
    pool.query('INSERT INTO "Plate"."posting"(user_id, plate_seen, state_observed, date, comment)Values ($1, $2, $3, $4, $5);', [user_id, seen, observe, date, comment], (err, result) => {
        if (err) {
            console.log(err);
            res.redirect('/post');
        } else {
            res.render('postconfirm.ejs');;
        }
    });
});

// Post edit page route
app.get('/postedit', isLoggedIn, (req, res) =>{
        let user_id = req.session.user.user_id
        let entry = req.query.entry_id
        // Pulls the post information from database based on entry and user id
        pool.query('SELECT * FROM "Plate".posting WHERE user_id = $1 AND entry_id = $2', [Number(user_id), Number(entry)], (err, result) => {
            if (err) {
                console.log(err);
                res.redirect('/profile');
            } else {
                // console.log(result.rows)
                // passes post information to webpage
                res.render('postedit.ejs', { result: result.rows, entry_id: entry});
            }
        })
})

//Update Posting functionality - confirms edit was made in database
app.post('/editconfirm', isLoggedIn, (req,res) =>{
        let seen = req.body.plate_seen
        let observe = req.body.state_observed
        let date = req.body.date
        let comment = req.body.comment
        let entry_id = req.body.entry_id
        // SQL query to update the following values in the entry id's row based on the edit page's inputs
        pool.query('UPDATE "Plate"."posting" SET plate_seen = $1, state_observed = $2, date = $3, comment = $4 WHERE entry_id = $5', [seen, observe, date, comment, entry_id], (err, result) => {
            if (err) {
                console.log(err);
                res.redirect('/profile');
            } else {
                res.render('editconfirm.ejs');
            }
        })});

// Delete Posting Functionality - confirms post was deleted in database
app.post('/deleteconfirm', isLoggedIn, (req,res) =>{
        const entry = req.body.entry_id
        // console.log(req.body)
        // SQL Query to delete a post from the Posting table based on the entry_id given from the profile page
        pool.query('DELETE FROM "Plate"."posting" WHERE entry_id = $1', [entry], (err, result) => {
            if (err) {
                console.log(err);
                res.redirect('/profile');
            } else {
                res.render('deleteconfirm.ejs')
            }
        })
});


// let url = "/Platepals";

app.listen(port, () => console.log(`PlatePals running on port ${port}`));
