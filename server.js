const express = require('express')
const app = express()//express 라이브러리 사용을 위해 사용


app.use(express.static(__dirname + '/public'))//서버는 public 폴더 안에 있는 것들을 자유롭게 쓰겠다!
app.set('view engine','ejs')//ejs 세팅
app.use(express.json())
app.use(express.urlencoded({extended:true})) //서버로 데이터 post 요청을 할 때 받은 데이터를 보려면 "요청.body" 쓰려면 해야 하는 세팅


const { MongoClient } = require('mongodb')

let db
const url = 'mongodb+srv://admin:1212@yubinkim.vdjthal.mongodb.net/?retryWrites=true&w=majority&appName=yubinKim';
new MongoClient(url).connect().then((client)=>{//몽고클라이언트를 이용해서 변수로 저장된 url로 접속을 하고 성공하면 
  console.log('DB연결성공')
  db = client.db('student_board')

  app.listen(2020, () => {//db가 연결이 되야 서버가 접속할 수 있게 해줌
    console.log('http://localhost:2020 에서 서버 실행중')
  })

}).catch((err)=>{
  console.log(err)
})



app.get('/',(요청, 응답)=>{
    응답.send('반갑다')
})

app.get('/login',(요청, 응답)=>{
    응답.render('login.ejs')//render는 views폴더가 기본 경로이다.
})

app.get('/signup',(요청, 응답)=>{
    응답.render('signup.ejs')
  
})


app.post('/register', (요청, 응답)=>{
    
})