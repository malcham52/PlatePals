-- Creating Database
CREATE SCHEMA "Plate";

-- SERIAL data type incrementally adds 1 to user id everytime an entry is made
CREATE TABLE "Plate".Login (
user_id SERIAL,
password varchar (30),
email varchar (80),
fname varchar (30),
lname varchar (40) DEFAULT NULL
);

-- Same insertion of serial to add 1 each time an entry is made
CREATE TABLE "Plate".posting (
    user_id int,
    entry_id SERIAL,
    plate_seen varchar(20),
    state_observed varchar(20),
    date date,
    comment varchar(1000) NULL,
    timestamp timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Plate".Contact_Us (
    c_name varchar(80),
    c_phone varchar(10) DEFAULT NULL,
    c_email varchar(80),
    c_comment varchar(1000)
    );

-- Test Inputs to ensure Database is working

INSERT INTO "Plate"."login"(
    password, email, fname, lname)
Values ('hey', 'mel@mel.com', 'mel', 'habtu');

INSERT INTO "Plate"."login"(
    password, email, fname, lname)
Values ('hello', 'john@smith.com', 'John', 'Smith');

INSERT INTO "Plate"."posting"(
    user_id, plate_seen, state_observed, date, comment)
Values ('1', 'mty4523', 'poor', '01/02/2023', 'great car');

INSERT INTO "Plate"."posting"(
    user_id, plate_seen, state_observed, date, comment)
Values ('2', 'indiana', 'alabama', '2023/02/01', 'great car');

INSERT INTO "Plate"."posting"(
    user_id, plate_seen, state_observed, date, comment)
Values ('2', 'kansas', 'missouri', '2023/02/05', 'ok car');

INSERT INTO "Plate".Contact_Us (
    c_name, c_phone, c_email, c_comment)
Values ('Chuck', '5121235521', 'chuck@echeese.com', 'test comment')

-- Testing the READ function from database
SELECT * FROM "Plate"."login" ORDER BY lname DESC

SELECT * FROM "Plate"."login3" ORDER BY user_id DESC

SELECT * FROM "Plate"."posting"

SELECT * FROM "Plate"."postingbackup"

SELECT * FROM "Plate"."contact_us"

SELECT * FROM "Plate".posting WHERE user_id = 4 AND entry_id = 5

SELECT COUNT (*) FROM "Plate".posting WHERE user_id = 4;
SELECT * FROM "Plate".posting WHERE user_id = 4

SELECT fname FROM "Plate".login WHERE user_id = 4

SELECT * FROM "Plate".posting ORDER BY date DESC;
SELECT fname FROM "Plate".login WHERE user_id = 6

-- Updated Count code to show name of plate seen with count and in descending order
-- TODO: Use Query below for "State Rankings" column in Competition Page
SELECT COUNT (*), plate_seen FROM "Plate".posting GROUP BY plate_seen ORDER BY COUNT(*) DESC

-- TODO: User query below for "User Rankings" column in Competition Page
    -- TODO: Use as a reference for "Most Recent Sighting" column on Competition Page
SELECT COUNT (*), fname FROM "Plate".posting e
INNER JOIN "Plate".login d ON e.user_id = d.user_id
GROUP BY fname ORDER BY COUNT(*) DESC




SELECT user_id, email, fname, lname FROM "Plate"."login" ORDER BY user_id DESC


CREATE TABLE "Plate".postingbackup AS 
TABLE "Plate".posting;


-- Old Code

-- CREATE TABLE "Plate".Login (
-- user_id varchar(30),
-- password varchar (30),
-- email varchar (80),
-- fname varchar (30),
-- lname varchar (40) DEFAULT NULL
-- )

-- CREATE TABLE "Plate".posting (
--     user_id varchar(30),
--     entry_id int ,
--     plate_seen varchar(20),
--     state_observed varchar(20),
--     date date,
--     comment varchar(1000) NULL,
--     timestamp timestamp DEFAULT CURRENT_TIMESTAMP
-- );

-- DROP TABLE "Plate".posting;