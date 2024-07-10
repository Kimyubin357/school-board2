const express = require('express')
const app = express()//express 라이브러리 사용을 위해 사용
const methodOverride = require('method-override')
const session = require('express-session')//express-session 라이브러리 사용
const passport = require('passport')// passport 라이브러리 사용
const LocalStrategy = require('passport-local') 
const bcrypt = require('bcrypt')//비밀번호 해시를 위한 라이브러리
const MongoStore = require('connect-mongo')

app.use(passport.initialize())
app.use(session({
  secret: '암호화에 쓸 비번',//세션을 만들때 문자열을 암호화할 때 쓰는 비번
  resave : false, // 요청을 날릴 때마다 세션을 갱신할지 말지
  saveUninitialized : false, // 로그인을 안해도 세션을 만들건지
  cookie :{maxAge : 60 * 60 * 1000},
  store : MongoStore.create({
    mongoUrl : 'mongodb+srv://admin:1212@yubinkim.vdjthal.mongodb.net/?retryWrites=true&w=majority&appName=yubinKim',
    dbName : 'student_board'
  })
})) 
app.use(passport.session())//여기 app.use 순서 중요함 

app.use(methodOverride('_method'))//put delete 사용을 위한 라이브러리
app.use(express.static(__dirname + '/public'))//서버는 public 폴더 안에 있는 것들을 자유롭게 쓰겠다!
app.set('view engine','ejs')//ejs 세팅
app.use(express.json())
app.use(express.urlencoded({extended:true})) //서버로 데이터 post 요청을 할 때 받은 데이터를 보려면 "요청.body" 쓰려면 해야 하는 세팅


const { MongoClient, ObjectId } = require('mongodb')

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
    console.log(요청.user)
    응답.render('login.ejs')//render는 views폴더가 기본 경로이다.
})
passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('user').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }
  
  if (await bcrypt.compare(입력한비번, result.password)) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))
passport.serializeUser((user, done) => {
  console.log(user)
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username })
  })
})
passport.deserializeUser(async(user, done) => {
  let result = await db.collection('user').findOne({_id : new ObjectId(user.id)})
  delete result.password
  process.nextTick(() => {
    return done(null, user)
  })
})
app.post('/login',(요청, 응답, next)=>{
  passport.authenticate('local',(error,user,info)=>{
    if(error) return 응답.status(500).json(error)
    if(!user) return 응답.status(401).json(info.message)
    요청.logIn(user,(err)=>{
      if(err) return next(err)
      응답.redirect('/request-list')
  })
  })(요청, 응답, next)

})
app.get('/signup',(요청, 응답)=>{
  응답.render('signup.ejs')//render는 views폴더가 기본 경로이다.
})

app.post('/signup',async(요청, 응답)=>{
  try{
    let result = await db.collection('user').findOne({ username : 요청.body.username })

    if(result==null){
      let hash = await bcrypt.hash(요청.body.password,10)

      await db.collection('user').insertOne({username: 요청.body.username, password : hash})
      응답.redirect('/login')
    }else{
      응답.send('DB에 이미 있어 ㅅㄱ')
    }
    
  } catch(e){
    console.log(e)
    응답.status(500).send('서버 에러남')
  }
})
app.get('/request-list/request',(요청, 응답)=>{
  응답.render('request.ejs')
})

app.post('/please',async(요청,응답)=>{
  try{
    await db.collection('request').insertOne({title : 요청.body.title, content : 요청.body.content})
    응답.redirect('/request-list')
  } catch(e){
    console.log(e)
    응답.status(500).send('서버 에러남')
  }
})

app.get('/request-list', async(요청, 응답)=>{
  let result = await db.collection('request').find().toArray();
  응답.render('request-list.ejs', {공지목록 : result , 개수 : 0})
})
app.get('/request-list/:page', async(요청, 응답)=>{
  let count = await db.collection('request').count();
  let result = await db.collection('request').find().skip((요청.params.page-1)*5).limit(5).toArray();
  응답.render('request-list.ejs', {공지목록 : result , 개수 : count})
})


app.get('/request-list/detail/:id',async(요청, 응답)=>{
  try{
    let result = await db.collection('request').findOne({ _id : new ObjectId(요청.params.id)})
    if(result == null){
      응답.status(404).send('이상한 url 입력함')
    }
    응답.render('detail.ejs', {공지글 : result })
  }catch(e){
    console.log(e)
    응답.status(404).send('이상한 url 입력함')
  }
})
app.get('/request-list/edit/:id',async(요청, 응답)=>{//수정하기 버튼 api
  try{
    let result = await db.collection('request').findOne({ _id : new ObjectId(요청.params.id)})
    if(result == null){
      응답.status(404).send('이상한 url 입력함')
    }
    응답.render('edit.ejs', {공지글 : result })
  }catch(e){
    console.log(e)
    응답.status(404).send('이상한 url 입력함')
  }
})
app.post('/update/:id',async(요청,응답)=>{
  try{
    await db.collection('request').updateOne({_id : new ObjectId(요청.params.id) }, {$set : {title : 요청.body.title, content : 요청.body.content}})
    응답.redirect('/request-list')
  } catch(e){
    console.log(e)
    응답.status(500).send('서버 에러남')
  }
})
app.delete('/delete', async(요청, 응답)=>{
  await db.collection('request').deleteOne({_id : new ObjectId(요청.query.id)})
  응답.send('삭제완료')
  
})
