var mysql = require('mysql'),
		CONFIG = require(__dirname + '/../config.json'),
    exec = require('child_process').exec,
		fs = require('fs'),
		sqlConn = mysql.createConnection(CONFIG.connObject),
		positionTranslate = {
			'basketball': ['未知', '控球後衛', '得分後衛', '小前鋒', '大前鋒', '中鋒'],
			'volleyballb': ['未知', '主攻手', '攔中手', '舉球員', '自由球員'],
			'volleyballg': ['未知', '主攻手', '攔中手', '舉球員', '自由球員'],
			'softball': ['未知', '投手', '內野手', '外野手']
		};
		
		sqlConn.connect();

exports.main = function (req, res) {
	if (req.session.type !== 'admin') {
		res.redirect('/');
		return;
	}
	var type = req.session.type || '',
			account = req.session.account || '';
	
	// Get player profile
	try {
		sqlConn.query("SELECT `id`, `type`, `position`, `name`, `department`, `avatar`, `exp_years` FROM `players`", function (err, rows, field) {
			if (err) throw err;
			
			var players = {},
					i;
			
			for (i in rows) {
				rows[i].position = positionTranslate[rows[i].type][rows[i].position];
				if (rows[i].avatar == ''){
					rows[i].avatar = './images/unknown.png';
				} else {
					rows[i].avatar = './avatars/' + rows[i].avatar;
				}
				if (!players[rows[i].type])
					players[rows[i].type] = [];
				players[rows[i].type].push(rows[i]);
			}
			
		  res.render('manage', { 
		  	title: '2013 紅藍明星對抗賽',
		  	page: 'manage',
		  	type: type,
		  	stnum: account,
		  	players: players
		  });
		});
	} catch (e) {
		console.dir(e);
	}
	
}

exports.pictures = function (req, res) {
	var playerId = req.params.playerId;
	fs.readFile(req.files['player-picture'].path, function (err, data) {
		fs.writeFile('./public/avatars/' + playerId, data, function(e) {
      exec('gm mogrify --resize 100x100 ' + __dirname + '/../public/avatars/' + playerId, function (err, stdout, stderr) {
        console.log('Resize stdout: ' + stdout);
        console.log('Resize stderr: ' + stderr);
      });
			sqlConn.query("UPDATE `players` SET `avatar` = ? WHERE `id` = ?", [playerId, playerId]);
			res.json({statusText: 'uploaded'});
		});
	});
}

exports.add = function (req, res) {
	var ball = req.params.ball,
			data = req.body,
			playerId;
			
	// Replacement default
	data.years = data.years || '(empty)';
	data.score = data.score || 0;
	data.rebound = data.rebound || 0;
	data.assist = data.assist || 0;
	data.block = data.block || 0;
	data.steal = data.steal || 0;
	data.award = data.award || '無';
	data.special = data.special || '無';
	data.win = data.win || 0;
	data.ab = data.ab || 0;
	data.hit = data.hit || 0;
	data.hr = data.hr || 0;
	
	if (data.name == '' || data.department == '' || isNaN(parseInt(data.years, 10))) {
		res.json({statusText: 'empty'});
		return;
	}
			
	try {
	sqlConn.query("INSERT INTO `players` (`type`, `position`, `name`, `department`, `exp_years`) VALUES (?, ?, ?, ?, ?)", [ball, data.position, data.name, data.department, data.years], function (err, rows, field) {
		if (err) throw err;
		console.dir(rows);
		playerId = rows.insertId;
		switch (ball) {
		case 'basketball':
			sqlConn.query("INSERT INTO `basketball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'score', data.score]);
			sqlConn.query("INSERT INTO `basketball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'rebound', data.rebound]);
			sqlConn.query("INSERT INTO `basketball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'assist', data.assist]);
			sqlConn.query("INSERT INTO `basketball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'block', data.block]);
			sqlConn.query("INSERT INTO `basketball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'steal', data.steal]);
			break;
		case 'volleyballb':
		case 'volleyballg':
			sqlConn.query("INSERT INTO `volleyball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'award', data.award]);
			sqlConn.query("INSERT INTO `volleyball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'special', data.special]);
			break;
		case 'softball':
			if (data.position == 1){
				sqlConn.query("INSERT INTO `softball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'win', data.win]);
			} else {
				sqlConn.query("INSERT INTO `softball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'ab', data.ab]);
				sqlConn.query("INSERT INTO `softball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'hit', data.hit]);
				sqlConn.query("INSERT INTO `softball_record` (`player_id`, `type`, `value`) VALUES (?, ?, ?)", [playerId, 'hr', data.hr]);
			}
			break;	
		}
		res.json({statusText: 'success', playerId: playerId});
	});	
	} catch (e) {
		console.dir(e);
		res.writeHead(500);
		res.end();
	}
}
