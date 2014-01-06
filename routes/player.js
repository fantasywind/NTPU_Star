var mysql = require('mysql'),
		fs = require('fs'),
		CONFIG = require(__dirname + '/../config.json'),
		sqlConn = mysql.createConnection(CONFIG.connObject),
		type_translate = {
			'basketball': '籃球',
			'volleyballb': '男排',
			'volleyballg': '女排',
			'softball': '壘球'
		},
		position_translate = {
			'basketball': ['未知', '控球後衛', '得分後衛', '小前鋒', '大前鋒', '中鋒'],
			'volleyballb': ['未知', '主攻手', '攔中手', '舉球員', '自由球員'],
			'volleyballg': ['未知', '主攻手', '攔中手', '舉球員', '自由球員'],
			'softball': ['未知', '投手', '內野手', '外野手']
		};
		sqlConn.connect();

exports.show = function (req, res) {
	var type = req.session.type || '',
			account = req.session.account || '',
			id = req.params.id || 0,
			player,
			table_type,
			record = {},
			i;
		
	/*if (req.header('Referer')){
		if (req.header('Referer').indexOf('facebook') != -1) {
			res.redirect('/');
			return;
		}
	}*/
		
	if (id === 0) {
		res.redirect('/');
		return;
	}
	
	// Get player profile
	try {
		sqlConn.query("SELECT `id`, `type`, `position`, `name`, `department`, `avatar`, `exp_years`, (SELECT COUNT(*) FROM `votes` WHERE player_id = players.id) AS votes FROM `players` WHERE `id` = ?", id, function (err, rows, field) {
			if (err) throw err;
			
			if (!rows.length) {
				res.redirect('/');
				return;
			}
			
			rows[0].ball = type_translate[rows[0].type];
			rows[0].position = position_translate[rows[0].type][rows[0].position];
			if (rows[0].avatar == ''){
					rows[0].avatar = '/images/unknown.png';
			} else {
				rows[0].avatar = '/avatars/' + rows[0].avatar;
			}
			player = rows[0];
			if (player.type === 'volleyballb' || player.type === 'volleyballg')
				table_type = 'volleyball';
			else
				table_type = player.type;
			
			sqlConn.query("SELECT * FROM `" + table_type + "_record` WHERE `player_id` = ?", id, function (err, rows, field) {
				if (err) throw err;
				
				if (rows.length) {
					for (i in rows) {
						record[rows[i].type] = rows[i].value;
					}
					if (record.ab) {
						record.win = 0;
						record.avg = Math.round((record.hit / record.ab) * 1000) / 1000;
					} else {
						record.ab = 0;
						record.avg = 0;
						record.hr = 0;
						record.hit = 0;
					}
				}

				res.render('player', { 
			  	title: '2013 紅藍明星對抗賽',
			  	page: 'player',
			  	type: type,
			  	player: player,
			  	record: record
			  });
			});
		});
	} catch (e) {
		console.dir(e);
	}
	
}
