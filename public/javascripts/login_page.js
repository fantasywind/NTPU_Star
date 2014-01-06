$(function(){
	$("input[name='account']").focus();
	$("#get-pass").click(function(e){
		var stnum = parseInt($("#stnum").val(), 10),
				$this = $(this),
				check = true;
		
		e.preventDefault();
		
		if (isNaN(stnum)) {
			$("#form-status").text('請確定您的學號正確無誤');
			check = false;
		}
	/*	
		if (stnum >= 410200000 || stnum <= 49500000){
			$("#form-status").text('目前僅提供在學中學生投票唷');
			check = false;
		}*/
		
		if (!$this.hasClass('disabled') && check) {
			$this.addClass('disabled');
			$this.text('帳號建立中...');
			$.post('/new_account', {stnum: stnum}, function (json) {
				if (json.statusText === 'fail') {
					$("#form-status").text('請確定您的學號正確無誤');
					$this.removeClass('disabled');
				} else if (json.statusText === 'duplicate') {
					alert('帳號已存在! 請直接登入系統投票，或至您的信箱收取認證信取得投票密碼唷!');
					$("#get-account").modal('hide');
				} else {
					alert('認證信寄出成功!');
					$("#get-account").modal('hide');
				}
				$this.text('取得密碼');
			}, 'json');
		}
	});
});
