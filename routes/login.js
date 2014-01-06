var crypto = require('crypto'),
		mysql = require('mysql'),
		mail = require("nodemailer"),
		smtp = mail.createTransport("SMTP", {
			service: "Gmail",
			auth: {
				user: "ntpustar@gmail.com",
				pass: "ntpu2013"
			}
		}),
		mailOptions,
		CONFIG = require(__dirname + '/../config.json'),
		sqlConn = mysql.createConnection(CONFIG.connObject);
		
		//mail test
		//mailOptions = {
		//	from: 'no-reply@ntpustar.gmail.com',
		//	to: ['fantasyatelier@gmail.com'],
		//	subject: '2013 紅藍明星對抗賽 投票密碼單'
		//};

function randomString (string_length) {
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
			random_string = '',
			i = 0,
			rnum;
	for (; i < string_length; i += 1) {
		rnum = Math.floor(Math.random() * chars.length);
		random_string += chars.substring(rnum, rnum + 1);
	}
	return random_string;
}

exports.update_pass = function (req, res) {
	var new_password = req.body.password,
			check = req.body.password_c,
			token = req.body.token,
			stnum = req.body.account;
	
	if (new_password !== check) {
		res.render('password', {
			title: '2013 紅藍明星對抗賽',
			msg: 'incorrect',
			stnum: stnum,
			token: token
		});
		return;
	}
	
	if (!new_password.length || !check.length){
		res.render('password', {
			title: '2013 紅藍明星對抗賽',
			msg: 'empty',
			stnum: stnum,
			token: token
		});
		return;
	}
	try {
	sqlConn.query("SELECT `salt` FROM `users` WHERE `password` = ?", token, function (err, rows, field) {
		if (err) {
			console.dir(err);
			res.send(404, '<p>找不到這個帳號！</p><p><a href="/">>> 前往活動網站</a></p>');
		} else if (rows.length) {
			var hashed = crypto.createHash('md5').update(new_password).digest('hex'),
					combined = crypto.createHash('md5').update(hashed + rows[0].salt).digest('hex');
			sqlConn.query('UPDATE `users` SET `password` = ? WHERE `password` = ?', [combined, token], function (err) {
				if (err) {
					console.dir(err);
					res.send(404, '<p>找不到這個帳號！</p><p><a href="/">>> 前往活動網站</a></p>');
				} else {
					res.redirect('/login');
				}
			});
		} else {
			res.send(404, '<p>找不到這個帳號！</p><p><a href="/">>> 前往活動網站</a></p>');
		}
	});
	} catch (ex) {
		console.log('------------- UPDATE PASSWORD ERROR ------------------');
		console.dir(ex);
	}

	
}

exports.get_token = function (req, res) {
	var stnum = req.query.stnum || '';
	try {
	sqlConn.query("SELECT `password` FROM `users` WHERE `account` = ?", stnum, function (err, rows, field) {
		if (err) console.dir(err);
		if (rows.length)
			res.send(200, "<a href='http://ntpustar.shockpaper.com/change_pass?token=" + rows[0].password + "' target='_blank'>" + stnum + " 的密碼設定連結</a>");
		else
			res.send(404, "<p>使用者不存在！</p>");
	});
	} catch (e) {
		console.log('*************** GET TOKEN ERROR ***************')
		console.dir(e)
	}	
}

exports.change_pass = function (req, res) {
	var token = req.query.token;
	try {
	sqlConn.query("SELECT `account` FROM `users` WHERE `password` = ?", token, function (err, rows, field) {
		if (err) {
			console.dir(err);
			res.charset = 'utf-8';
			res.send(404, '<p>找不到這個帳號！</p><p><a href="/">>> 前往活動網站</a></p>');
		} else {
			if (rows.length) {
				res.render('password', {
					title: '2013 紅藍明星對抗賽',
					msg: '',
					stnum: rows[0].account,
					token: token
				});
			} else {
				res.charset = 'utf-8';
				res.send(404, '<p>此帳號已經啟用囉！</p><p><a href="/">>> 前往活動網站</a></p>');
			}
		}
	});
	} catch (ex) {
		console.log('******************* CHANGE PASS ERROR *************************');
		console.dir(ex);
	}
	
}

exports.comfirm_mail = function (req, res) {
	var student_number = req.body.stnum,
			default_password = randomString(32),
			default_salt = randomString (6),
			default_hash = crypto.createHash('md5').update(default_password + default_salt).digest('hex'),
			body_string,
			account_check = true,
			mail_options = {
				from: 'no-reply@ntpustar.gmail.com',
				to: ['s' + student_number + '@webmail.ntpu.edu.tw'],
				subject: '2013 紅藍明星對抗賽 投票密碼單'
			};
				
	student_number = parseInt(student_number, 10);
	
	if (isNaN(student_number)) {
		res.json({statusText: 'fail'});
		return;
	}

	sqlConn.query("SELECT * FROM `users` WHERE account = ?", student_number, function (err, rows, field){
		if (err) console.dir(err);
if (rows.length) {
	res.json({statusText: 'duplicate'});
	return;
}
	/*
	if (student_number >= 410200000 || student_number <= 49800000){
		res.json({statusText: 'fail'});
		return;
	}*/
	
	
	sqlConn.query("INSERT INTO `users` (`type`, `account`, `password`, `salt`) VALUES ('student', " + student_number + ", '" + default_hash + "', '" + default_salt + "')", function (err, rows, field) {
		if (err) {
			console.log('*********** CREATE ACCOUNT ERROR ***************')
			console.dir(err);
			account_check = false;
		}
	});
	
	if (!account_check) {
		res.json({statusText: 'duplicate'});
		return;
	}
		
	body_string = "<h1>2013 紅藍明星對抗賽 投票密碼單</h1>";
	body_string += "<p>您的學號是 <b>" + student_number + "</b></p>";
	body_string += "<p>請連線至 <a href='http://ntpustar.shockpaper.com/change_pass?token=";
	body_string += default_hash + "'>本連結</a> 設定您的投票密碼</p>";
	body_string += "<hr/><p>如上述連結無法直接點擊請使用 http://ntpustar.shockpaper.com/change_pass?token=" + default_hash + " 本連結手動前往設定密碼";
	body_string += "<p>本信件由 2013 臺北大學紅藍明星對抗賽主辦單位寄出，請勿直接回信。</p>";
	body_string += "<p>系統由 Shock! 三峽客 數位媒體部門製作</p>";
	mail_options.html = body_string;
	
	smtp.sendMail(mail_options, function (error, response) {
		if (error) {
			console.log(error);
		} else {
			console.log('帳號認證: ' + student_number);
			res.json({statusText: 'success'});
		}
	});

	});
}

exports.logout = function (req , res) {
	delete req.session.uid;
	delete req.session.type;
	delete req.session.account;
	res.redirect('/');
}

exports.check = function (req, res) {
	var account = req.body.account || req.cookies.account,
			password = req.body.password || req.cookies.password;
	
	if ((!account && !password) || req.route.method === 'get') {
		res.render('login', { title: '2013 紅藍明星對抗賽', msg: '' });
	} else if (req.route.method === 'post'){
		if (account === '' || password === '') {
			res.render('login', { title: '2013 紅藍明星對抗賽', msg: 'empty' });
		} else {
			sqlConn.query("SELECT * FROM `users` WHERE account = ?", account, function (err, rows, field) {
				if (err) {
					console.log('************* Login Error!! ***************')
					console.dir(err)
				} else if (!rows.length) {
					res.render('login', { title: '2013 紅藍明星對抗賽', msg: 'incorrect' });
				} else {
					var hashedPassword = crypto.createHash('md5').update(password).digest('hex'),
							combined = crypto.createHash('md5').update(hashedPassword + rows[0].salt).digest('hex');
					if (combined !== rows[0].password) {
						res.render('login', { title: '2013 紅藍明星對抗賽', msg: 'incorrect' });
					} else {
            console.log('\033[035m登入系統: ' + rows[0].account + '\033[039m');
						req.session.uid = rows[0].id;
						req.session.type = rows[0].type;
						req.session.account = rows[0].account;
						req.cookies.account = rows[0].account;
						req.cookies.password = hashedPassword;
						res.redirect('/');
					}
				} 
			});
		}
	}
}
