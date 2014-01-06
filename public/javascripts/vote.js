$(".voter").click(function () {
	var $this = $(this),
			$tr = $this.parents('tr'),
			limit = parseInt($tr.attr('data-allow'), 10),
			$count = $tr.find('span'),
			voted = 0;
	
	$this.toggleClass('active');
	$this.find('.player-voted').toggleClass('active');
	
	voted = $tr.find('.voter.active').length;
	$count.text(voted + ' ');
	
	if (voted > limit) {
		$tr.addClass('red');
		$count.addClass('red');
	} else {
		$tr.removeClass('red');
		$count.removeClass('red');
	}
});
$("#submit-vote").click(function () {
	var out_of_limit = $("tr.red").length,
			vote_list = {
				'basket': [],
				'batt': [],
				'bmid': [],
				'bset': [],
				'bfree': [],
				'gatt': [],
				'gset': [],
				'p': [],
				'if': [],
				'of': []
			};
	
	if (out_of_limit !== 0){
		alert('您不能投這麼多票唷！')
		return;
	}
	
	$(".voter.active").each(function () {
		var $this = $(this),
				id = $this.attr('data-player-id'),
				type = $this.parents('tr').attr('data-type');
		vote_list[type].push(id);
	});
	
	$.post('/vote', vote_list, function (json) {
		if (json.status === 'success') {
			alert('您已完成投票，感謝您的參與！\n記得到球員資料頁幫您所支持的球員按讚唷！');
		} else {
			alert('出現問題，我們正在努力修復中，造成您的不便請見諒！');
		}
		location.href = '/';
	}, 'json')
});