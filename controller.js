const express = require('express');
const app = express();
const body_parser = require('body-parser');

const mariaDb = require('mariadb');

app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: true}));


app.all("/*", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.setHeader("Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, " +
        "Origin,Accept, X-Requested-With, " +
        "Content-Type, " +
        "Access-Control-Request-Method, " +
        "Access-Control-Request-Headers");
    next();
});

const pool = mariaDb.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'admin',
    database: 'userslist'
});

//віддаємо дефолтні  дані
app.get('/', (req, res) => {
    pool.getConnection()
        .then(conn => {
            res.send("connected ! connection id is " + conn.threadId);
            conn.end();
        })
        .catch(err => {
            res.send("not connected due to error: " + err);
        });
})

//віддаємо масив юзерів
app.get('/users/:par', (req, res) => {
    pool.getConnection()
        .then(conn => {
            conn.query(`SELECT * FROM userslist limit ${req.params.par}`)
                .then((rows) => {
                    conn.query(`SELECT COUNT(*) AS namesCount FROM userslist`)
                        .then(_res =>{
                            let model = {
                                rows:rows,
                                length:_res[0].namesCount
                            }
                            res.json(model);
                            conn.end();
                        }).catch(err => {
                        res.send(err);
                        conn.end();
                    })
                })
                .catch(err => {
                    res.send(err);
                    conn.end();
                })
        }).catch(err => {
        res.send(err);
        conn.end();
    });
})

//віддаємо юзера по id для редагування
app.get('/getUser/id/', (req, res) => {
    pool.getConnection()
        .then(conn => {
            conn.query(`SELECT Id,FirstName,LastName,Email,Password FROM userslist WHERE Id = ?`,
                [req.params.id])
                .then((value) => {
                    res.json(value);
                    conn.end();
                })
                .catch(err => {
                    res.sendStatus(404);
                    conn.end();
                })
        }).catch(() => {
        res.sendStatus(404);
    });
})


//зберігаємо створенного юзера
app.post('/addUser/', (req, res) => {
    pool.getConnection()
        .then(conn => {
            conn.query('INSERT INTO userslist (FirstName,LastName,Email,Password) VALUES (?,?,?,?)',
                [req.body.firstName, req.body.lastName, req.body.email, req.body.password]
            )
                .then((result) => {
                    res.json(result);
                    conn.end();
                })
                .catch(() => {
                    res.sendStatus(404);
                    conn.end();
                })
        }).catch(() => {
        res.sendStatus(404);
        pool.end();
    });
})

// видаляємо юзера  по id
app.delete(`/deleteUser/:id`, (req, res) => {
    pool.getConnection()
        .then(conn => {
            conn.query(`DELETE FROM userslist WHERE id = ${req.params.id}`)
                .then(() => {
                    res.json(200);
                    conn.end();
                })
                .catch(() => {
                    res.sendStatus(404);
                })
        }).catch(() => {
        res.sendStatus(404);
    });

})

//зберігаємо  юзера після редагування
app.put('/updateUser/:id/', (req, res) => {
    const id = Number(req.params.id);
    pool.getConnection()
        .then(conn => {
            conn.query(`UPDATE userslist SET FirstName=?,LastName=?,Email=?,Password =? WHERE Id = ${id}`,
                [req.body.firstName, req.body.lastName, req.body.email, req.body.password])
                .then(() => {
                    res.json(200);
                    conn.end()
                })
                .catch(() => {
                    console.log(req.body.name)
                    res.send(404);
                    conn.end();
                })
        }).catch(() => {
        res.sendStatus(404);
    });
});

app.listen(0, () => {
    console.log('SERVER RUNNING');
})

module.exports = app;


