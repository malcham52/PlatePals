// Checks to see if a user is logged in
exports.isLoggedIn = (req,res,next) =>{
    if(req.session.user){
        // If user is logged in, move on to the next function in req/res cycle
        return next()
    } else {
        // If user is not logged in, redirects user to login page
        res.redirect('/login')
    }
}

exports.isLoggedOut = (req,res,next) =>{
    if(!req.session.user){
        return next()
    } else {
        res.redirect('/profile')
    }
}