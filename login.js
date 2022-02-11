
const electron = require('electron').remote
const fs = require('fs')
const path = require('path');
const app = require('electron').remote.app
const axios = require('axios');

const jsonfile = path.join(app.getPath("userData"),'./userdatastorage.json')
console.log('login json file path: ', jsonfile )

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

fs.access(jsonfile, (err) => {
  //JSON File not found -> create new json file and
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
                                var regID1 = loginForm.email.value;
                                var regID2 = loginForm.confirmemail.value;
                                console.log('button clicked')
                                console.log(regID1 + ' confirm: ' + regID2)

                                //first check that both fields have text
                                if(regID1 === '' & regID2 === '')
                                {
                                  document.getElementById("login-error-msg").innerText = 'Please enter your RegistrationID'
                                  document.getElementById("login-error-msg").style.opacity = 1;
                                  console.log('no text in fields')
                                }
                                else{
                                  //check if its valid email

                                    if (regID1 ===  regID2 ) {
                                      var apiCall = 'https://health-iot.labs.vu.nl/api/user/get/'+ regID1
                                      //get user with this id, see if it exists
                                      axios.get(apiCall)
                                        .then(function (response) {
                                           //there is a user with this ID
                                           if(response.data.user_data.length!=0)
                                           {
                                               fs.readFile(jsonfile, 'utf8', (err, userString) => {
                                                  if (err) {
                                                      console.log("Error reading file from disk:", err)
                                                      return
                                                  }
                                                  try {
                                                        var user = JSON.parse(userString)
                                                        user.login = true
                                                        user.username = regID1
                                                        console.log('try login user ', user)

                                                        fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                                                            if (err)
                                                            {
                                                              console.log('Error writing login user json file:', err)
                                                            }
                                                            else{
                                                              console.log('Saved login user ', user)
                                                              // wait(5000)
                                                              location.href = 'landing.html'
                                                            }
                                                        })
                                                      }
                                                     catch(err) {
                                                            console.log('Error parsing JSON string:', err)
                                                        }
                                                    })
                                              }
                                              else{
                                                 document.getElementById("login-error-msg").innerText = 'No account with this RegisterID found.'
                                                 document.getElementById("login-error-msg").style.opacity = 1;
                                               }

                                        })
                                        .catch(function (error) {
                                          // handle error
                                          document.getElementById("login-error-msg").innerText = 'Internet Error.'
                                          document.getElementById("login-error-msg").style.opacity = 1;
                                          console.log(error);
                                        })
                                        .then(function () {
                                          // always executed
                                        });






                                        } else {
                                          document.getElementById("login-error-msg").innerText = 'RegistrationIDs not matching'
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
                        var regID1 = loginForm.email.value;
                        var regID2 = loginForm.confirmemail.value;
                        console.log('button clicked')
                        console.log(regID1 + ' confirm: ' + regID2)

                        //first check that both fields have text
                        if(regID1 === '' & regID2 === '')
                        {
                          document.getElementById("login-error-msg").innerText = 'Please enter your RegistrationID'
                          document.getElementById("login-error-msg").style.opacity = 1;
                          console.log('no text in fields')
                        }
                        else{
                          //check if its valid email

                            if (regID1 ===  regID2 ) {
                              var apiCall = 'https://health-iot.labs.vu.nl/api/user/get/'+ regID1
                              //get user with this id, see if it exists
                              axios.get(apiCall)
                                .then(function (response) {
                                  // handle success
                                   if(response.data.user_data.length!=0)
                                   {
                                       fs.readFile(jsonfile, 'utf8', (err, userString) => {
                                          if (err) {
                                              console.log("Error reading file from disk:", err)
                                              return
                                          }
                                          try {
                                                var user = JSON.parse(userString)
                                                user.login = true
                                                user.username = regID1
                                                console.log('try login user ', user)

                                                fs.writeFile(jsonfile, JSON.stringify(user), (err) => {
                                                    if (err)
                                                    {
                                                      console.log('Error writing login user json file:', err)
                                                    }
                                                    else{
                                                      console.log('Saved login user ', user)
                                                      // wait(5000)
                                                      location.href = 'landing.html'
                                                    }
                                                })
                                              }
                                             catch(err) {
                                                    console.log('Error parsing JSON string:', err)
                                                }
                                            })
                                      }
                                      else{
                                         document.getElementById("login-error-msg").innerText = 'No account with this RegisterID found.'
                                         document.getElementById("login-error-msg").style.opacity = 1;
                                       }


                                })
                                .catch(function (error) {
                                  // handle error
                                  document.getElementById("login-error-msg").innerText = 'Internet Error.'
                                  document.getElementById("login-error-msg").style.opacity = 1;
                                  console.log(error);
                                })
                                .then(function () {
                                  // always executed
                                });

                                } else {
                                  document.getElementById("login-error-msg").innerText = 'RegistrationIDs not matching'
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
