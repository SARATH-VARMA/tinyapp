const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
app.use(cookieParser())

const { checkEmailExists } = require('./helper')

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "8rvcfl"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "5xn69m"}
};

const users = { 
  "8rvcfl": {
    id: "8rvcfl", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "5xn69m": {
    id: "5xn69m", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

function generateRandomString() {
  return Math.random().toString(36).substring(2,8);
}

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] ? users[req.cookies["user_id"]] : null, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
    const templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);

  } else {
    res.redirect('/login')
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] ? users[req.cookies["user_id"]] : null, shortURL: req.params.shortURL, longURL:  urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    let shortURL = generateRandomString(req.body.longURL)
    urlDatabase[shortURL] = {"longURL" : req.body.longURL, "userID" : req.cookies["user_id"]};
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.status(403).send("Only registered and logged in users can create new tiny URLs");
  }
});

//redirects to the corresponding long URL
app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("Couldn't find the tiny URL");
  }
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');  
});

app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL].longURL = req.body.newlongURL;
  res.redirect('/urls');  
});

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  const user = checkEmailExists(users, email);
  if(user) {
    if (user.password === password) {
      res.cookie('user_id', user.id);
      res.redirect('/urls'); 
    } else {
      res.status(403).send("Password is incorrect");
    }

  } else {
    res.status(403).send("Couldn't find your account");
  }
         
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');         
});

app.get("/register", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] ? users[req.cookies["user_id"]] : null };
  res.render('registration', templateVars);         
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if(email && password) {
    if(checkEmailExists(users, email)) {
      res.status(400).send("Email already registered");
    } else {
      const id = generateRandomString();
      const user = {
        id,
        email,
        password
      }
      users[id] = user;
      res.cookie('user_id', id);
      res.redirect('/urls');  
    } 
  } else {
    res.status(400).send("Email and password fields are required");
  }       
});

app.get("/login", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] ? users[req.cookies["user_id"]] : null };
  res.render('login', templateVars);         
});