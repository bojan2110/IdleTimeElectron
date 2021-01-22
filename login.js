const electron = require('electron').remote
const fs = require('fs')
const path = require('path');
const app = require('electron').remote.app



const jsonfile = path.join(app.getPath("userData"),'./uj2.json')
console.log('login json file path: ', jsonfile )
var validEmails = ["henri@henri.com", "aart@aart.com", "michel@michel.com","simoski@simoski.com","new@new.com"];
function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

fs.access(jsonfile, (err) => {
  if (err) {
    //this json file doesn't exist, add it
      console.log('User data file does not exist')
      const user = {
        "username":"",
        "login":false
        ,"appClosingTime":0
      }

      fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
              if (err)
              {

                console.log('Error writing login user json file:', err)
              }
              else{
                console.log('Saved login user ')
                fs.readFile(jsonfile, 'utf8', (err, userString) => {
                    if (err) {
                        console.log("Error reading file from disk:", err)
                    }
                    try {
                          var user = JSON.parse(userString)

                          if(user.login)
                          {
                            location.href = 'landing.html'
                          }
                          else {
                            const loginForm = document.getElementById("login-form");
                            const loginButton = document.getElementById("login-form-submit");
                            const loginErrorMsg = document.getElementById("login-error-msg");

                            loginButton.addEventListener("click", (e) => {
                                e.preventDefault();
                                var email = loginForm.email.value;
                                var confirmemail = loginForm.confirmemail.value;
                                console.log('button clicked')
                                console.log(email + ' confirm: ' + confirmemail)

                                //first check that both fields have text
                                if(email === '' & confirmemail === '')
                                {
                                  document.getElementById("login-error-msg").innerText = 'Please enter email'
                                  document.getElementById("login-error-msg").style.opacity = 1;
                                  console.log('no text in fields')
                                }
                                else{
                                  //check if its valid email
                                  if (validateEmail(email) & validateEmail(confirmemail)) {
                                    if (email ===  confirmemail ) {
                                      if (validEmails.indexOf(email) > -1) {
                                        fs.readFile(jsonfile, 'utf8', (err, userString) => {
                                            if (err) {
                                                console.log("Error reading file from disk:", err)
                                                return
                                            }
                                            try {
                                                  var user = JSON.parse(userString)
                                                  user.login = true
                                                  user.username = email
                                                  console.log('try login user ', user)

                                                  fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                                                          if (err)
                                                          {

                                                            console.log('Error writing login user json file:', err)
                                                          }
                                                          else{
                                                            console.log('Saved login user ', user)
                                                            wait(5000)
                                                            location.href = 'landing.html'
                                                          }
                                                  })
                                                }
                                           catch(err) {
                                                  console.log('Error parsing JSON string:', err)
                                              }
                                        })
                                          //In the array!
                                        } else {
                                          //Not in the array
                                          document.getElementById("login-error-msg").innerText = 'No account with this email found.'
                                          document.getElementById("login-error-msg").style.opacity = 1;
                                        }


                                    } else {

                                       document.getElementById("login-error-msg").innerText = 'Emails do not match'

                                        document.getElementById("login-error-msg").style.opacity = 1;
                                    }
                                  } else {
                                      document.getElementById("login-error-msg").innerText = 'Not a valid email'

                                      document.getElementById("login-error-msg").style.opacity = 1;
                                  }

                                }
                            })

                          }

                        }
                   catch(err) {
                          console.log('Error parsing JSON string:', err)
                      }
                })
              }
      })
    } else {
      console.log('User data file exists!')
      fs.readFile(jsonfile, 'utf8', (err, userString) => {
          if (err) {
              console.log("Error reading file from disk:", err)
          }
          try {
                console.log('USER DATA (Login Screen): ', userString)
                var user = JSON.parse(userString)

                if(user.login)
                {
                  location.href = 'landing.html'
                }
                else {
                  const loginForm = document.getElementById("login-form");
                  const loginButton = document.getElementById("login-form-submit");
                  const loginErrorMsg = document.getElementById("login-error-msg");

                  loginButton.addEventListener("click", (e) => {
                      e.preventDefault();
                      var email = loginForm.email.value;
                      var confirmemail = loginForm.confirmemail.value;
                      console.log('button clicked')
                      console.log(email + ' confirm: ' + confirmemail)

                      //first check that both fields have text
                      if(email === '' & confirmemail === '')
                      {
                        document.getElementById("login-error-msg").innerText = 'Please enter email'
                        document.getElementById("login-error-msg").style.opacity = 1;
                        console.log('no text in fields')
                      }
                      else{
                        //check if its valid email
                        if (validateEmail(email) & validateEmail(confirmemail)) {
                          if (email ===  confirmemail ) {
                            if (validEmails.indexOf(email) > -1) {
                              fs.readFile(jsonfile, 'utf8', (err, userString) => {
                                  if (err) {
                                      console.log("Error reading file from disk:", err)
                                      return
                                  }
                                  try {
                                        var user = JSON.parse(userString)
                                        user.login = true
                                        user.username = email
                                        console.log('try login user ', user)

                                        fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                                                if (err)
                                                {

                                                  console.log('Error writing login user json file:', err)
                                                }
                                                else{
                                                  console.log('Saved login user ', user)
                                                  wait(5000)
                                                  location.href = 'landing.html'
                                                }
                                        })
                                      }
                                 catch(err) {
                                        console.log('Error parsing JSON string:', err)
                                    }
                              })
                                //In the array!
                              } else {
                                //Not in the array
                                document.getElementById("login-error-msg").innerText = 'No account with this email found.'
                                document.getElementById("login-error-msg").style.opacity = 1;
                              }


                          } else {

                             document.getElementById("login-error-msg").innerText = 'Emails do not match'

                              document.getElementById("login-error-msg").style.opacity = 1;
                          }
                        } else {
                            document.getElementById("login-error-msg").innerText = 'Not a valid email'

                            document.getElementById("login-error-msg").style.opacity = 1;
                        }

                      }
                  })

                }

              }
         catch(err) {
                console.log('Error parsing JSON string:', err)
            }
      })
    }
})
