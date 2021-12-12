const express = require('express');
var multer = require('multer')
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const btoa = require('btoa');
const atob = require('atob');

const { del } = require('express/lib/application');
const app = express();
const mysceret = 'mySplSecret'


var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  }
  ,
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
var upload = multer({ storage: storage })

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.post('/user/register', (req, res) => {
  console.log(typeof req.body)
  user_list = []

  inp_data = req.body
  data_exists = false

  fs.readFile("users.json", "utf8", function (err, data) {
    if (data == '') {
      array = []
    }
    else {
      array = JSON.parse(data);
    }

    array.forEach(element => {
      if (element['email'] === inp_data['email']) {
        data_exists = true
        console.log(element)
      }
    });
    if (!data_exists) {
      array.push(inp_data)
    }
    writeData(res, array);

  })

})

app.get('/user/:avatar_enc/avatar', (req, res) => {
  entc = req.params['avatar_enc']
  fil = atob(entc)

  fs.readFile("users.json", "utf8", function (err, data) {
    array = JSON.parse(data);
    array.forEach(element => {
      if (element['avatar_enc'] === entc) {
        res.sendFile(__dirname + '/uploads/' + element['avatar'])
      }
    });

  })

})

app.delete('/user/me', verifyJWTToken, (req, res) => {

  fs.readFile("users.json", "utf8", function (err, data) {
    array = JSON.parse(data);
    i=0
    find_index = -1
    array.forEach(element => {    
      if (element['email'] === req.authdata['userdata']['username']) {  
        find_index=i
      }
      i=i+1
    });
    array.splice(find_index, 1);
    writeData(res, array)
    res.send({response:200})

  })
})

app.delete('/user/me/avatar', verifyJWTToken, (req, res) => {

  fs.readFile("users.json", "utf8", function (err, data) {
    array = JSON.parse(data);
    array.forEach(element => {
      if (element['email'] === req.authdata['userdata']['username']) {
        
        delete element['password']
        delete element['avatar']
        delete element['avatar_enc']
        writeData(res, array)
        res.json(element)
      }
    });
  })
})

app.post('/user/me/avatar', verifyJWTToken, upload.single('avatar'), (req, res) => {

  fil = btoa(req.file.filename)

  fs.readFile("users.json", "utf8", function (err, data) {
    array = JSON.parse(data);
    array.forEach(element => {
      if (element['email'] === req.authdata['userdata']['username']) {
        element['avatar'] = req.file.filename
        element['avatar_enc'] = fil
        writeData(res, array)
        delete element['password']
      }
    });

  })
  var response = ''
  response += "Files uploaded successfully.<br>"
  response += `<img src="${req.file.path}" /><br>`
  response += `avatar id: <p>${fil}<\p>`

  return res.send(response)

})

app.get('/', (req, res) => {
  res.sendFile('public/index.html');
});

app.post('/profile-upload-single', verifyJWTToken, upload.single('upload'), function (req, res, next) {
  var response = ''
  response += "Files uploaded successfully.<br>"
  response += `<img src="${req.file.path}" /><br>`

  return res.send(response)
})


app.put('/user/me', verifyJWTToken, (req, res) => {

  fs.readFile("users.json", "utf8", function (err, data) {
    array = JSON.parse(data);
    array.forEach(element => {
      if (element['email'] === req.authdata['userdata']['username']) {
        element['age'] = req.body['age']
        writeData(res, array)
        delete element['password']
        res.json(element)
      }
    });

  })

})

app.get('/user/me', verifyJWTToken, (req, res) => {


  fs.readFile("users.json", "utf8", function (err, data) {
    array = JSON.parse(data);
    array.forEach(element => {
      if (element['email'] === req.authdata['userdata']['username']) {
        delete element['password']
        res.json(element)
      }
    });

  })

})

function userCredCheck(userdata, req, res) {
  data_exists = false
  fs.readFile("users.json", "utf8", function (err, data) {
    array = JSON.parse(data);
    array.forEach(element => {
      if (element['email'] === userdata['username'] && element['password'] === userdata['password']) {
        data_exists = true
        console.log(element)
      }
    });

    if (data_exists) {
      jwt.sign({ userdata }, mysceret, (err, token) => {

        fs.readFile("session.json", "utf8", function (err, data) {
          if (data == '') {
            session = {}
          }
          else {
            session = JSON.parse(data);
          }

          session.push(token)

          fs.writeFile("session.json", JSON.stringify(session
          ), function (err) {
            console.log(err)
          });

        })
         const reso={ tokenI: token }
        res.send(JSON.stringify(reso))

      })
    } else {
      res.sendStatus(403)
    }

  })
}

app.post('/user/logout',verifyJWTToken,(req,res)=>{
  fs.readFile("session.json", "utf8", function (err, data) {
    if (data == '') {
      session = {}
    }
    else {
      session = JSON.parse(data);
    }
    find_index = -1 
    i=0
    session.forEach(ele =>{
      if(ele === req.token){
       find_index = i
      }
     i=i+1
    })

    session.splice(find_index,1)
    writeSessData(res,session)
    res.send({res:200})

  })

})


function writeSessData(res, user_list) {
  fs.writeFile("session.json", JSON.stringify(user_list
  ), function (err) {
    // obj = { status: 200 };
    // res.end(JSON.stringify(obj));
    console.log(err)
  });
}

app.post('/user/login',  (req, res) => {
  userdata = req.body
  userCredCheck(userdata, req, res)
})

app.get('/user/home', verifyJWTToken, (req, res) => {
  if (req.authdata) {
    res.json({ message: "welcome home" })
  }
})

function writeData(res, user_list) {
  fs.writeFile("users.json", JSON.stringify(user_list
  ), function (err) {
    // obj = { status: 200 };
    // res.end(JSON.stringify(obj));
    console.log(err)
  });
}

function verifyJWTToken(req, res, next) {
  const bererToken = req.headers['authorization']
  if (typeof bererToken !== 'undefined') {
    const bererArr = bererToken.split(' ')
    jwt_token = bererArr[1]
    req.token = jwt_token
    err = null;
    fs.readFile("session.json", "utf8", function (err, data) {
      if (data == '') {
        session = {}
      }
      else {
        session = JSON.parse(data);
      }

      if (!session.includes(jwt_token)) {
        res.sendStatus(403)
      } else {
        jwt.verify(jwt_token, mysceret, (err, data) => {
          if (err) {
            res.sendStatus(403)
          } else {
            req.authdata = data
            next()
          }
        })
      }

    })

  } else {
    res.sendStatus(403)
  }
}



app.listen(8000);