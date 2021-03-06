define("html5_puzzle",['avalon-min',"/canvasElement",'/canvasImg','html5_imgupload'],function(avalon,canvasElement,
	canvasImg,img_upload){
	var canvas_img=[],update_puzzle=false,canvas_w=548,canvas_h=411;
	var html5_puzzle=avalon.define({
		$id:'html5_puzzle',
		cancel:function(){
			canvas._aImages=[];
			puzzle_delete();
			$('preload_puzzle').style.display='none';
		},
		middleware_list:[],
		select_bg:function(i,e){
			$('puzzle_bg').onload = function() {
				var ctx=$('main_canvas-canvas-background').getContext('2d');
				ctx.clearRect(0,0,canvas_w,canvas_h);
				canvas_img[0]=new canvasImg.Img($('puzzle_bg'),{});
				canvas.setCanvasBackground(canvas_img[0]);
			};
			$('puzzle_bg').setAttribute('src','imgs/'+i+'.jpg');
			e.stopPropagation();
		}
	});
	var canvas = new canvasElement.Element();
	canvas.init('main_canvas', {
		width : canvas_w,
		height : canvas_h
	});
	function onSelect(file_filter){
		for(var i=this._start,len=file_filter.length;i<len;i++) {//遍历选中图片
			var reader=new FileReader();
			reader.onload=(function(i){//图片读取的回调
				return function(e){
					var dataURL=e.target.result,canvas_middleware=$('canvas_middleware'),
					ctx=canvas_middleware.getContext('2d'),img=new Image();
					img.onload = function() {//图片加载的回调
						if(img.width>200||img.height>200){//等比例缩放
							var prop=Math.min(200/img.width,200/img.height);
							img.width=img.width*prop;
							img.height=img.height*prop;
						}
						//设置中转canvas尺寸
						canvas_middleware.width=img.width;
						canvas_middleware.height=img.height;
						ctx.drawImage(img, 0, 0, img.width, img.height);
						//将读取图片转换成base64,写入.middleware_list的src
						html5_puzzle.middleware_list.push(canvas_middleware.toDataURL("image/jpeg"));
						if(!file_filter[i+1]){
							//图片延迟加载到canvas,因为canvas有个读取过程，但是没有回调
							var t = window.setTimeout(function() {
								if(!update_puzzle)
									canvas_puzzle.init();
								else{
									var target=canvas._prevTransform.target;
									canvas._aImages[getCurImg()]=new canvasImg.Img(document.
										querySelectorAll('.middleware_img')[0],{
										top:target.top,
										left:target.left,
										scalex:target.scalex,
										scaley:target.scaley,
										angle:canvas.curAngle
									});
									canvas.renderTop();
									html5_puzzle.middleware_list.clear();
									update_puzzle=false;
								}
								clearTimeout(t);
							}, 1000);
						}
					};
					img.src = dataURL;
				};
				delete reader;
			})(i);
			reader.readAsDataURL(file_filter[i]);//开始读取图片
		}
		this._start=0;
		img_upload_instance._destroy();
	}
	var img_upload_instance=new img_upload({
		add_btn:'puzzle_add',
		onSelect:onSelect
	});
	var canvas_puzzle= function() {
		return {
			init : function() {
				var img_list=document.querySelectorAll('.middleware_img');
				//第一张作为背景图片
				canvas_img[0]=new canvasImg.Img($('puzzle_bg'), {});
				avalon.each(img_list,function(i,el){
					canvas_img.push(new canvasImg.Img(el, {}));
					canvas.addImage(canvas_img[i+1]);
				});
				canvas.setCanvasBackground(canvas_img[0]);
				// canvas.renderAll(false,false);
				html5_puzzle.middleware_list.clear();
				canvas_img=[];
				$('puzzle_add_input').value='';
				avalon.bind($('puzzle_upload'),'click',puzzle_upload);
				$('puzzle_upload').style.display='inline-block';
			}
		};
	}();
	function getCurImg(){
		var oImg=canvas._prevTransform.target;
		for(var i=0;i<canvas._aImages.length;i++){
			if(canvas._aImages[i]._oElement.src==oImg._oElement.src){
				return i;
			}
		}
	}
	avalon.bind($('puzzle_delete'),'click',function(){
		canvas._aImages.splice(getCurImg(),1);
		canvas.renderAll(false,false);
		$('canvas_menu').style.display="none";
		if(canvas._aImages.length==0){
			$('puzzle_upload').style.display='none';
			avalon.unbind($('puzzle_upload'),'click',puzzle_upload);
		}
	});
	avalon.bind($('puzzle_update'),'click',function(){
		update_puzzle=true;
		$('puzzle_add_input').click();
	});
	function puzzle_upload(){
		avalon.post('http://localhost:8080/qzone/photo/upload',{
			imgData:canvas.canvasTo('jpeg').substr(22)
		},function(data){

		},'json');
	}
	avalon.scan($('html5_puzzle'));
});