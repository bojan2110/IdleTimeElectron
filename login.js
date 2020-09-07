const electron = require('electron').remote
const fs = require('fs')
const path = require('path');


const jsonfile = path.join(__dirname,'./electronuser.json')

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
                const username = loginForm.email.value;
                const password = loginForm.confirmemail.value;

                if (username ===  password ) {
                    // alert("You have successfully logged in.");
                    fs.readFile(jsonfile, 'utf8', (err, userString) => {
                        if (err) {
                            console.log("Error reading file from disk:", err)
                            return
                        }
                        try {
                              var user = JSON.parse(userString)
                              user.login = true
                              user.username = username
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

                } else {
                    loginErrorMsg.style.opacity = 1;
                }
            })

          }

        }
   catch(err) {
          console.log('Error parsing JSON string:', err)
      }
})
