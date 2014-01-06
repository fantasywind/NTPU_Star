var mysql = require('mysql'),
		CONFIG = require(__dirname + '/../config.json'),
		sqlConn = mysql.createConnection(CONFIG.connObject);

sqlConn.connect();

exports.submit = function (req, res) {
	var type = req.session.type || '',
			voter_id = req.session.uid || '',
			account = req.session.account || '',
			vote_list = {
				'basket': req.body['basket'],
				'batt': req.body['batt'],
				'bmid': req.body['bmid'],
				'bset': req.body['bset'],
				'bfree': req.body['bfree'],
				'gatt': req.body['gatt'],
				'gset': req.body['gset'],
				'p': req.body['p'],
				'if': req.body['if'],
				'of': req.body['of']
			},
			i,
			j;
			
		if (voter_id === '') {
			res.json({
				status: 'failed'
			});
			return;
		}
			
		try {
			for (i in vote_list) {
				for (j in vote_list[i]) {
					var field = i + (parseInt(j, 10) + 1);
					
					sqlConn.query('INSERT INTO `votes` (player_id, vote_type, voter_id) VALUES (?, ?, ?)', [vote_list[i][j], (i + (parseInt(j, 10) + 1)), voter_id], function (err, rows, field) {
						if (err) {
							console.log('\033[031m - [account: ' + voter_id + ']Error: ' + err + '\033[039m');
						};
					});
				}
			}
		} catch (e) {
			console.log('---------------- INSERT VOTE PROBLEM !! --------------------')
			console.dir(e);
		}
		
		res.json({
			status: 'success'
		});
}
