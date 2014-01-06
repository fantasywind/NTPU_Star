var mysql = require('mysql'),
		http = require('http'),
		FB_LIKE_PERSENTAGE = .15,
		CONFIG = require(__dirname + '/../config.json'),
		sqlConn = mysql.createConnection(CONFIG.connObject),
		players = {},
		votes,
		vote_update_time = new Date(),
		positionTranslate = {
			'basketball': ['未知', '控球後衛', '得分後衛', '小前鋒', '大前鋒', '中鋒'],
			'volleyballb': ['未知', '主攻手', '攔中手', '舉球員', '自由球員'],
			'volleyballg': ['未知', '主攻手', '攔中手', '舉球員', '自由球員'],
			'softball': ['未知', '投手', '內野手', '外野手']
		};
/*
 * GET home page.
 */
 
 sqlConn.connect();

exports.index = function(req, res) {
	var accountType = req.session.type || '',
			account = req.session.account || '',
			now_stamp = new Date(),
			vote_start = true,
			i,
			j;
			
	if (now_stamp.getTime() <= 1364745600000) {
		vote_start = false;
	}
	
	// 取得票數資料 1min 更新
	if ((now_stamp.getTime() - vote_update_time.getTime()) > 300000 || !votes) {
		var players_url = [],
				playerQstring = "";
		
    console.log('正在更新票數資料.')

		vote_update_time = now_stamp;
		
		// 網站記票
		votes = {
			'basket1': {},
			'basket2': {},
      'basket3': {},
			'batt': {},
			'bmid': {},
			'bset': {},
			'bfree': {},
			'gatt': {},
			'gset': {},
			'p': {},
			'if': {},
			'of': {}
		};
	
		var tmp_votes = {
			'basket': {},
			'batt': {},
			'bmid': {},
			'bset': {},
			'bfree': {},
			'gatt': {},
			'gset': {},
			'p': {},
			'if': {},
			'of': {}
		};
		
		// FB likes
		sqlConn.query('SELECT DISTINCT `player_id` FROM `votes`', function (err, rows, field) {
			for (var i in rows) {
				players_url.push('http://ntpustar.shockpaper.com/player/' + rows[i].player_id);
			}
			playerQstring = JSON.stringify(players_url)
			playerQstring = playerQstring.substring(1, playerQstring.length - 1);
			console.log('向 facebook 查詢中')
      http.get('http://api.facebook.com/method/fql.query?format=json&query=select  url,like_count from link_stat where url in(' + playerQstring + ')', function (httpRes) {
				var json = "";

				httpRes.on('data', function (chunk) {
					json += chunk;
				});
				
				httpRes.on('end', function () {
					var fbVotes = JSON.parse(json),
							fbCount = {};
					for (var i in fbVotes) {
						fbCount[(fbVotes[i].url.split('player/')[1])] = fbVotes[i].like_count;
					}
	        console.dir(fbVotes);        
          console.log('已取得票數資訊，分析中')

					// 網站投票
					sqlConn.query("SELECT `name`, `id` FROM `players`", function (err, rows, field){
            if (err) {
              console.dir(err);
            }

            console.log('Query!!')

						for (i in rows) {
							players[rows[i].id] = rows[i].name;
						}

            console.log('球員清單: ')
						
						sqlConn.query("SELECT * FROM `votes`", function (err, rows, field) {
							if (err) {
								console.dir(err);
							}
							
							for (i in rows) {
								var type = rows[i].vote_type.replace(/\d+$/, '');
								
								if (!tmp_votes[type][players[rows[i].player_id]]) {
									tmp_votes[type][players[rows[i].player_id]] = {site: 0, fb: parseInt(fbCount[rows[i].player_id], 10), total: 0};
								}
								tmp_votes[type][players[rows[i].player_id]].site += 1;
							}
							
							// 計算機分
							for (type in tmp_votes) {
								for (player in tmp_votes[type]) {
									tmp_votes[type][player].total = Math.round((tmp_votes[type][player].site * (1 - FB_LIKE_PERSENTAGE) + tmp_votes[type][player].fb * FB_LIKE_PERSENTAGE) * 100) / 100;
								}
							}
							

console.dir(tmp_votes)
							// 排序
							for (type in tmp_votes) {
								var sortable = [];
								
								for (player in tmp_votes[type]) {
									sortable.push([player, (tmp_votes[type][player].total)]);
								}
								sortable.sort(function (a, b) {
									return b[1] - a[1];
								});
                if (type == 'basket') {
                  var b1 = sortable.slice(0, 5),
                      b2 = sortable.slice(5, 10),
                      b3 = sortable.slice(10, 15);

                  for (player in b1) {
                    votes['basket1'][b1[player][0]] = tmp_votes[type][b1[player][0]];
                  }
                  for (player in b2) {
                    votes['basket2'][b2[player][0]] = tmp_votes[type][b2[player][0]];
                  }
                  for (player in b3) {
                    votes['basket3'][b3[player][0]] = tmp_votes[type][b3[player][0]];
                  }
                } else {
								  sortable = sortable.slice(0, 5);

								  for (player in sortable){
									  votes[type][sortable[player][0]] = tmp_votes[type][sortable[player][0]];
								  }
                }
							}
							
							//votes = tmp_votes;
							
							console.log('\033[036m - Fetched latest votes: \033[039m');
							console.dir(votes);
				
							// Render Page
							res.render('index', {
								title: '2013 紅藍明星對抗賽',
								page: 'index',
								update: vote_update_time.getHours() + ':' + vote_update_time.getMinutes(),
								vote_start: vote_start,
								type: accountType,
								stnum: account,
								votes: votes
							});
						});
					});
				});
			}).on('error', function (e) {
				
			});
		});
	} else {
		res.render('index', {
			title: '2013 紅藍明星對抗賽',
			page: 'index',
			update: vote_update_time.getHours() + ':' + vote_update_time.getMinutes(),
			vote_start: vote_start,
			type: accountType,
			stnum: account,
			votes: votes
		});
	}
};

exports.vote = function (req, res) {
	var type = req.session.type || '',
			account = req.session.account || '',
			candidates = {
				'basketball': {
					'basket': []
				},
				'volleyballb': {
					'batt': [],
					'bmid': [],
					'bset': [],
					'bfree': []
				},
				'volleyballg': {
					'gatt': [],
					'gset': []
				},
				'softball': {
					'p': [],
					'if': [],
					'of': []
				}
			},
			i;
	
	if (!req.session.type){
		res.redirect('/login');
		return;
	}
	// 檢查投票時間

	if (new Date().getTime() >= 1365696000000) {
		res.send('<script>alert("投票已於 4 月 12 日 00:00 結束囉！");location.href="/";</script>');
                return;
	}

	// 檢查投票記錄
	try {
		sqlConn.query("SELECT COUNT(*) AS voted FROM votes WHERE voter_id = ?", req.session.uid, function (err, rows, field) {
			if (rows[0].voted) {
				res.send('<script>alert("您已經投過票囉！");location.href="/";</script>');
				return;
			}
		});
	} catch (e) {
		console.dir(e);
	}
	
	// 讀取候選清單		
	try {
		sqlConn.query("SELECT * FROM `players`", function (err, rows, field) {
			if (err) throw err;
			
			for (i in rows) {
				if (rows[i].avatar == ''){
					rows[i].avatar = '/images/unknown.png';
				} else {
					rows[i].avatar = '/avatars/' + rows[i].avatar;
				}
				switch (rows[i].type) {
				case 'basketball':
					candidates.basketball['basket'].push(rows[i]);
					break;
				case 'volleyballb':
					switch (rows[i].position) {
					case 1:
						candidates.volleyballb['batt'].push(rows[i]);
						break;
					case 2:
						candidates.volleyballb['bmid'].push(rows[i]);
						break;
					case 3:
						candidates.volleyballb['bset'].push(rows[i]);
						break;
					case 4:
						candidates.volleyballb['bfree'].push(rows[i]);
						break;
					}
					break;
				case 'volleyballg':
					switch (rows[i].position) {
					case 1:
						candidates.volleyballg['gatt'].push(rows[i]);
						break;
					case 3:
						candidates.volleyballg['gset'].push(rows[i]);
						break;
					}
					break;
				case 'softball':
					switch (rows[i].position) {
					case 1:
						candidates.softball['p'].push(rows[i]);
						break;
					case 2:
						candidates.softball['if'].push(rows[i]);
						break;
					case 3:
						candidates.softball['of'].push(rows[i]);
						break;
					}
					break;
				default:
					break;
				}
			}
			res.render('vote', {
				title: '2013 紅藍明星對抗賽',
				page: 'vote',
				type: type,
				stnum: req.session.account,
				candidates: candidates
			});
		});
	} catch (e) {
		console.dir(e);
	}
}

exports.players = function(req, res) {
	var ball = req.params.ball || 'basketball',
			type = req.session.type || '',
			account = req.session.account || '';
			
	console.log('player page')
			
	// Get player profile
	try {
		sqlConn.query("SELECT `id`, `type`, `position`, `name`, `department`, `avatar`, `exp_years` FROM `players`", function (err, rows, field) {
			if (err) throw err;
			
			var players = {},
					i;
			
			for (i in rows) {
				rows[i].position = positionTranslate[rows[i].type][rows[i].position];
				if (rows[i].avatar == ''){
					rows[i].avatar = '/images/unknown.png';
				} else {
					rows[i].avatar = '/avatars/' + rows[i].avatar;
				}
				if (!players[rows[i].type])
					players[rows[i].type] = [];
				players[rows[i].type].push(rows[i]);
			}
			
		  res.render('profile', { 
		  	title: '2013 紅藍明星對抗賽',
		  	page: 'players',
		  	ball: ball,
		  	type: type,
		  	stnum: account,
		  	players: players
		  });
		});
	} catch (e) {
		console.dir(e);
	}
};

exports.info = function(req, res){
	var type = req.session.type || '',
			account = req.session.account || '';
  res.render('info', { title: '2013 紅藍明星對抗賽', page: 'info', type: type, stnum: account });
};

exports.forum = function(req, res){
	var type = req.session.type || '',
			account = req.session.account || '';
	res.redirect("/");
};
