const electron = require('electron').remote
const fs = require('fs')
const path = require('path');


const jsonfile = path.join(__dirname,'./electronuser.json')
var validEmails = ["henri@henri.com", "aart@aart.com", "michel@michel.com","simoski@simoski.com","test@test.com"];

function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

fs.readFile(jsonfile, 'utf8', (err, userString) => {
    if (err) {
        console.log("Error reading file from disk:", err)
        return
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
                                  fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                                          if (err)
                                          {
                                            console.log('Error writing file:', err)
                                          }
                                          else{
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
                        // alert("You have successfully logged in.");
                        // fs.readFile(jsonfile, 'utf8', (err, userString) => {
                        //     if (err) {
                        //         console.log("Error reading file from disk:", err)
                        //         return
                        //     }
                        //     try {
                        //           var user = JSON.parse(userString)
                        //           user.login = true
                        //           user.username = email
                        //           fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                        //                   if (err)
                        //                   {
                        //                     console.log('Error writing file:', err)
                        //                   }
                        //                   else{
                        //                     location.href = 'landing.html'
                        //                   }
                        //           })
                        //         }
                        //    catch(err) {
                        //           console.log('Error parsing JSON string:', err)
                        //       }
                        // })

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
