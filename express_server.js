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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
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
  const templateVars = { user: req.cookies["user_id"] ? users[req.cookies["user_id"]] : null };
  res.render("urls_new", templateVars);
});
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: req.cookies["user_id"] ? users[req.cookies["user_id"]] : null, shortURL: req.params.shortURL, longURL:  urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});
app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  let shortURL = generateRandomString(req.body.longURL)
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});
//redirects to the corresponding long URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});
app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls');  
});
app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.newlongURL;
  res.redirect('/urls');  
});
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie('username', username);
  res.redirect('/urls');         
});
app.post("/logout", (req, res) => {
  res.clearCookie('username');
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
      res.statusCode = 400;
      res.send("Email already registered " + res.statusCode);
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
    res.statusCode = 400;
    res.send("Email and password fields are required " + res.statusCode);
  }       
});