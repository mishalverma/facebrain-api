const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex= require('knex');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'test',
      database : 'facebrain'
    }
  });

// db.select('*').from('users').then(data => {
//     console.log(data);
// });

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res)=>{
    res.send(database.users);
})


app.post('/signin', (req, res) => {

    const {email, password} = req.body;
    if(!email || !password){
        return res.status(400).json("Incorrect Form Submission");
    }
    db.select('email', 'hash').from('login')
      .where('email', '=', email)
      .then(data => {
        const isValid = bcrypt.compareSync(password, data[0].hash);
        if (isValid) {
          return db.select('*').from('users')
            .where('email', '=', email)
            .then(user => {
              res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        } else {
          res.status(400).json('wrong credentials')
        }
      })
      .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req,res) => {
    const {email, name, password} = req.body;

    if(!email || !name || !password){
        return res.status(400).json("Incorrect Form Submission");
    }
    
    const hash = bcrypt.hashSync(password);

        db.transaction(trx => {
            trx.insert({
                hash: hash,
                email: email
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0],
                        name: name,
                        joined: new Date()
                    }).then(user => {
                        res.json(user[0]);
                    })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json("Unable to register"))
    
})

app.get('/profile/:id', (req,res) => {
    const {id} = req.params;
    // let found= false;

    db.select('*').from('users').where({id}).then(user => {
        if(user.length){
            res.json(user[0]);
        }else{
            res.status(400).json("Not Found");
        }
        
    })

    // database.users.forEach(user=> {
    //     if(user.id === id){
    //         found= true;
    //         return res.json(user);
    //     }  
    // })
    // if(!found){
    //     res.status(404).json('not found');
    // }
})

app.put('/image', (req,res)=>{
    const {id} = req.body;
    db('users')
    .where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries);
    }).catch(err => res.status(400).json("Unable to get Entries"))
})


app.listen(5000, ()=>{
    console.log("Server is running on port 5000");
})