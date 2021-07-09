const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

// Setting ejs as the template engine
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieSession = require('cookie-session');
app.use(
  cookieSession({
    name: 'session',
    keys: [
      'a2b14a14-3058-4fd6-a5a3-af1a35811c95',
      'ab119d51-2c95-4292-8e0e-e7c3533fb6de',
    ],
  })
);

const bcrypt = require('bcrypt');
const saltRounds = 10;

const { getUserByEmail, urlsForUser } = require('./helper')

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "8rvcfl"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "5xn69m"}
};

const users = {
  "8rvcfl": {
    id: "8rvcfl",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", saltRounds)
  },
  "5xn69m": {
    id: "5xn69m",
    email: "user2@example.com",
    password: bcrypt.hashSync("aaa bbb ccc ddd", saltRounds)
  }
};

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

app.get("/", (req, res) => {
  const newUser = req.session.user_id;
  if (newUser) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//List of URLs corresponding to each user
app.get("/urls", (req, res) => {
  const newUser = req.session.user_id;
  if (newUser) {
    const newUrls = urlsForUser(newUser, urlDatabase);
    const templateVars = { user: users[newUser], urls: newUrls };
    res.render("urls_index", templateVars);

  } else {
    const templateVars = { user: null, error: "Create account or Sign in to continue" };
    res.render("error", templateVars);
  }

});

// Route for new URL form
app.get("/urls/new", (req, res) => {
  const newUser = req.session.user_id;
  if (newUser) {
    const templateVars = { user: users[newUser] };
    res.render("urls_new", templateVars);

  } else {
    res.redirect('/login');
  }
});

// The short URL for the given ID
app.get("/urls/:shortURL", (req, res) => {
  const newUser = req.session.user_id;
  if (newUser) {
    const tinyURL = req.params.shortURL;
    if (urlDatabase[tinyURL]) {
      if (urlDatabase[tinyURL].userID === newUser) {
        const templateVars = { user: users[newUser], shortURL: tinyURL, longURL: urlDatabase[tinyURL].longURL};
        res.render("urls_show", templateVars);
      } else {
        res.send("Access not allowed");
      }
    } else {
      res.send("Invalid Id");
    }
  } else {
    res.send("Create account or Sign in to continue");
  }
});

//Save the short URL to database
app.post("/urls", (req, res) => {
  const user = req.session.user_id;
  if (user) {
    let shortURL = generateRandomString()
    urlDatabase[shortURL] = {"longURL" : req.body.longURL, "userID" : user};
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("Only registered and logged in users can create new tiny URLs");
  }
});

//Redirects to the corresponding long URL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("Couldn't find the tiny URL");
  }
});

//If user is logged in and owns the URL for the given ID, delete the URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const newUser = req.session.user_id;
  if (newUser) {
    if (urlDatabase[req.params.shortURL].userID === newUser) {
      delete urlDatabase[req.params.shortURL];
      res.redirect('/urls');
    } else {
      res.send("Access not allowed");
    }
  } else {
    res.send("Create account or Sign in to continue");
  }  
});

//If user is logged in and owns the URL for the given ID, update the URL
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;  
  const newUser = req.session.user_id;
  if(newUser) {
    if (urlDatabase[shortURL].userID === newUser) {
      urlDatabase[shortURL].longURL = req.body.newlongURL;
      res.redirect('/urls');
    } else {
      res.send("Access not allowed");
    }
  } else {
    res.send("Create account or Sign in to continue");
  }
});

//Login if email and password params match with an existing user
app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const user = getUserByEmail(email, users);
  if(user) {
    if (bcrypt.compareSync(password, users[user].password )) {
      req.session.user_id = users[user].id;
      res.redirect('/urls'); 
    } else {
      res.status(403).send("Password is incorrect");
    }

  } else {
    res.status(403).send("Couldn't find your account");
  }
         
});

//Logout 
app.post("/logout", (req, res) => {
  req.session['user_id'] = null;
  res.redirect('/urls');         
});

// Route for registration form
app.get("/register", (req, res) => {
  const newUser = req.session.user_id;
  if (newUser) {
    res.redirect('/urls');
  } else {
    res.render('registration', {user: null});
  }         
});

// Register a new user
app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if(email && password) {
    if (getUserByEmail(email, users)) {
      res.status(400).send("Email already registered");
    } else {
      const id = generateRandomString();
      const hashedPassword = bcrypt.hashSync(password, saltRounds);
      const user = {
        id,
        email,
        password : hashedPassword
      }
      users[id] = user;
      req.session.user_id = id;
      res.redirect('/urls');  
    } 
  } else {
    res.status(400).send("Email and password fields are required");
  }       
});

//Route for login form
app.get("/login", (req, res) => {
  const newUser = req.session.user_id;
  if (newUser) {
    res.redirect('/urls');
  } else {
    res.render('login', {user: null});
  }
});