$("#add-submit").click(function(){
	var $this = $(this),
			pane = $(".tab-pane.active"),
			ball = pane.attr('id'),
			image = pane.find('.picform'),
			ballTranslate = {
				'basketball': '籃球',
				'volleyballb': '男排',
				'volleyballg': '女排',
				'softball': '壘球'
			},
			data = {};
			
			data.name = pane.find("input[name='player-name']").val();
			data.department = pane.find("input[name='player-department']").val();
			data.position = pane.find("select[name='player-position']").val();
			data.years = pane.find("input[name='player-years']").val();
			
			switch (ball) {
			case 'basketball':
				data.score = pane.find("input[name='player-score']").val();
				data.rebound = pane.find("input[name='player-rebound']").val();
				data.assist = pane.find("input[name='player-assist']").val();
				data.block = pane.find("input[name='player-block']").val();
				data.steal = pane.find("input[name='player-steal']").val();
				break;
			case 'volleyballb':
			case 'volleyballg':
				data.special = pane.find("input[name='player-special']").val();
				data.award = pane.find("input[name='player-award']").val();
				break;
			case 'softball':
				data.ab = pane.find("input[name='player-ab']").val();
				data.hit = pane.find("input[name='player-hit']").val();
				data.hr = pane.find("input[name='player-hr']").val();
				data.win = pane.find("input[name='player-win']").val();
				break;
			}
			
			if (!$this.hasClass('disabled')){
				$this.addClass('disabled');
				$.ajax({
					url: './add_player/' + ball,
					type: 'POST',
					data: data,
					dataType: 'json',
					success: function (json) {
						$this.removeClass('disabled');
						if (json.statusText === 'success') {
							alert('新增資料成功！正在為您上傳照片，您可以繼續新增其他球員資料！');
							if (image.find('input').val() !== ''){
								image.attr('action', './upload_pic/' + json.playerId).submit();
								$("iframe").ready(function(){
									var html = $.parseHTML("<a class='player-box'><div><img src='./avatars/" + json.playerId + "' class='player-img' /><span class='player-name'>" + data.name + "</span></div></a>"),
											container = $( "#" + ball + "-player" );
									
									if (container.length){
										container.append(html);
									} else {
										container = $.parseHTML("<div class='span4'><h5>" + ballTranslate[ball] + "</h5></div>").append(html).appendTo($("#player-list"));
									}
									
								});
							}
							pane.find('input').val('');
						} else if (json.statusText === 'empty') {
							alert('基本資料不得為空唷');
						}
					}
				});
			}
});