// this sets the background color of the master UIView (when there are no windows/tab groups on it)
Titanium.UI.setBackgroundColor('#fff');

Ti.include('htmlparser.js');
Ti.include('soupselect.js');
Ti.include('moment.js');

var currRow = null
,  resetSwipedRow = function() {
	if (currRow) {
		currRow.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE;
		currRow.numView.backgroundColor = '#f6f6ef';
		currRow.topView.backgroundColor = '#fff';
		currRow.swipeView.animate({
			opacity: 0,
			duration: 250
		});
		currRow.topView.animate({
			opacity: 1,
			duration: 250
		});
		currRow = null;
	}
}, loadData = function(){
	var select = soupselect.select;
	var client = Ti.Network.createHTTPClient({
			// function called when the response data is available
			onload : function(e) {
				var rows = [];
				var handler = new htmlparser.DefaultHandler(function(err, dom) {
				  if (err) {
				  	// TODO show an actual network error alert
				    alert('Error: ' + err);
				  } else {
				  	// Save the cookie for later
				    Ti.App.Properties.setString('cookie', client.getResponseHeader('Set-Cookie'));
				    
				    select(dom, 'table').forEach(function(table) {
				    	if (table.children[0].children[0].attribs.class === 'title') {
						 	var currRow;
						 	for (var i = 0; i < table.children.length; i++) {
						 		var tr = table.children[i];
						      	if (i % 3 === 0) {
						      		if (tr.children != null) {
						      			currRow = {
							      			title: tr.children[2].children[0].children[0].data,
							      			link: tr.children[2].children[0].attribs.href
							      		};
							      		if (tr.children[2].children.length > 1)
								      		currRow.source = tr.children[2].children[1].children[0].data.replace(/( |\(|\))/g, '');
							      		if (tr.children[1].children != null && tr.children[1].children[0].children[0].type === "a")
								      		currRow.upvote = tr.children[1].children[0].children[0].attribs.href;
						      		} else
						      			i = table.children.length;
						      	} else if (i % 3 === 1){
						      		if (tr.children[1].children.length > 1) {
						      			currRow.time = tr.children[1].children[3].data.substring(1, tr.children[1].children[3].data.length - 4);
						      			currRow.points = tr.children[1].children[0].children[0].data.replace(' points', '');
						      			currRow.author = tr.children[1].children[2].children[0].data;
						      			var t = tr.children[1].children.length - 1;
						      			var comments = tr.children[1].children[t];
						      			while (comments.children[0].data.indexOf('comment') === -1 && 
						      				  comments.children[0].data.indexOf('discuss') === -1) {
						      				t = t - 1;
						      				comments = tr.children[1].children[t];
						      			}
						      			currRow.itemLink = comments.attribs.href;
						      			comments = comments.children[0].data;
						      			if (comments === "discuss")
						      				currRow.comments = 0;
						      			else
						      				currRow.comments = comments.replace(' comment', '').replace('s','');
						      		} else
						      			currRow.time = tr.children[1].children[0].data;
						      		rows.push(currRow);
						      	}
						 	}
				    	}
				    });
				  }
				});
				var parser = new htmlparser.Parser(handler);
				parser.parseComplete(this.responseText);
				
				var tablerows = [];
				for (var i = 0; i < rows.length; i++) {
					var row = rows[i],
					tirow = Ti.UI.createTableViewRow({
						className: 'hnRow',
						backgroundColor: '#f2f2f2',
						selectedBackgroundColor: '#ededdf'
					});
					tirow.hnrow = row;
					tirow.index = i;
					var topView = Ti.UI.createView({
						top: 0,
						left: 0,
						right: 0,
						height: Ti.UI.SIZE,
						layout:'vertical',
						backgroundColor: '#fff',
						zIndex: 1
					});
					var swipeView = Ti.UI.createView({
						height: 35,
						width: Ti.UI.SIZE,
						zIndex: 0,
						opacity: 0,
						layout: 'horizontal'
					});
					var upvoteImg = Ti.UI.createImageView({
						image: '/images/upvote.png',
						action: 'upvote'
					});
					var linkImg = Ti.UI.createImageView({
						image: '/images/url.png',
						left: 70,
						action: 'url'
					});
					var commentsImg = Ti.UI.createImageView({
						image: '/images/comments.png',
						left: 70,
						action: 'comments'
					});
					var touchstart = function(e) {
						e.cancelBubble = true;
						var x = e.x, y = e.y;
						e.source.image = '/images/' + e.source.action + 'Selected.png';
						var touchmove = function(e2) {
							e2.cancelBubble = true;
							if (e2.x - x > 40 || e2.y - y > 40)
								e2.source.image = '/images/' + e2.source.action + '.png';
							else
								e2.source.image = '/images/' + e2.source.action + 'Selected.png';
						}, touchcancel = function(e4) {
							e4.source.image = '/images/' + e4.source.action + '.png';
							e4.source.removeEventListener('touchmove', touchmove);
							e4.source.removeEventListener('touchcancel', touchcancel);
							e4.source.removeEventListener('touchend', touchend);
						}, touchend = function(e3) {
							e3.cancelBubble = true;
							e3.source.image = '/images/' + e3.source.action + '.png';
							if (e3.x - x < 40 || e3.y - y < 40) {
								if (e3.source.action === 'upvote') {
									// TODO Do upvote
									e3.source.image = '/images/upvoteDisabled.png';
									e3.source.removeEventListener('touchstart', touchstart);
								} else if (e3.source.action === 'url') {
									// TODO show Article Link / Hacker News Link dialog
								} else if (e3.source.action === 'comments') {
									// TODO show comment view
								}
							}
							e3.source.removeEventListener('touchmove', touchmove);
							e3.source.removeEventListener('touchcancel', touchcancel);
							e3.source.removeEventListener('touchend', touchend);
						};
						e.source.addEventListener('touchmove', touchmove);
						e.source.addEventListener('touchcancel', touchcancel);
						e.source.addEventListener('touchend', touchend);
					};
					upvoteImg.addEventListener('touchstart', touchstart);
					linkImg.addEventListener('touchstart', touchstart);
					commentsImg.addEventListener('touchstart', touchstart);
					swipeView.add(upvoteImg);
					swipeView.add(linkImg);
					swipeView.add(commentsImg);
					tirow.add(swipeView);
					topView.add(Ti.UI.createLabel({
						text: row.title,
						font: {fontFamily:'HelveticaNeue-Bold'},
						top: 2,
						left: 4,
						right: 4,
						touchEnabled: false
					}));
					var byline = '';
					if (row.author)
						byline = 'by ' + row.author + ', ';
					if (row.source)
						byline += 'from ' + row.source;
					topView.add(Ti.UI.createLabel({
						text: byline,
						font: {fontSize: 12},
						color: '#7a7a7a',
						top: 2,
						left: 4,
						right: 4,
						touchEnabled: false
					}));
					var numView = Ti.UI.createView({
						top: 4,
						left: 0,
						right: 0,
						touchEnabled: false,
						height: 22,
						backgroundColor: '#f6f6ef'
					});
					numView.add(Ti.UI.createLabel({
						text: row.points != null ? '🔺' + row.points : '',
						left: 4,
						color: '#7a7a7a',
						touchEnabled: false,
						zIndex: 0,
						font: {fontSize: 12}
					}));
					numView.add(Ti.UI.createLabel({
						text: row.comments != null ? (row.comments === 0 ? '0 💭' : row.comments + ' 💬') : '',
						right: 4,
						color: '#7a7a7a',
						touchEnabled: false,
						zIndex: 0,
						font: {fontSize: 12}
					}));
					numView.add(Ti.UI.createLabel({
						text: row.time,
						right: 0,
						left: 0,
						textAlign: 'center',
						color: '#7a7a7a',
						touchEnabled: false,
						zIndex: 1,
						font: {fontSize: 12}
					}));
					tirow.numView = numView;
					topView.add(numView);
					tirow.addEventListener('swipe', function(e) {
						e.cancelBubble = true;
						if (currRow == null || e.row.index !== currRow.index) {
							resetSwipedRow();
							e.row.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;
							e.row.topView.animate({
								opacity: 0,
								duration: 250
							});
							e.row.swipeView.animate({
								opacity: 1,
								duration: 250
							});
							currRow = e.row;
						}
					});
					tirow.topView = topView;
					tirow.swipeView = swipeView;
					tirow.add(topView);
					tablerows.push(tirow);
				}
				tableview.setData(tablerows);
				resetPullHeader(tableview);
				taActivityWindow.hide();
			},
			// function called when an error occurs, including a timeout
			onerror : function() {
				resetPullHeader(tableview);
				labelLastUpdated.lastUpdateDate = null;
				taActivityWindow.hide();
				var offlineAlert = Titanium.UI.createAlertDialog({
				    title: 'Network Error',
				    message: 'Sorry, there was an error.\nPlease try again later.',
				    buttonNames: ['Ok'],
				    cancel: 0
				});
				offlineAlert.show();
			},
			timeout : 20000  // in milliseconds
		});
		// Prepare the connection.
		client.open("GET", 'http://news.ycombinator.com/', true);
		if (Ti.App.Properties.hasProperty('cookie'))
			client.setRequestHeader('Cookie', Ti.App.Properties.getString('cookie'));
		// Send the request.
		client.send();
};

var win1 = Titanium.UI.createWindow({  
    title:'Front Page',
    backgroundColor:'#fff',
    barColor: '#d94000'
}), listsBtn = Ti.UI.createButton({
	title: 'Lists'
}), tableview = Ti.UI.createTableView()
,	taActivityWindow = (function() {
	var loadingView = Ti.UI.createView({
		width: '100%',
		height: '100%',
		backgroundColor: 'transparent',
		visible: false,
		zIndex: 50
	});
	
	var blackBox = Ti.UI.createView({
		backgroundColor: '#000',
		opacity: 0.6,
		width: 80,
		height: 80,
		top: '40%',
		left: 120,
		borderRadius: 10,
	});
	
	var activity = Ti.UI.createActivityIndicator({
		width: 'auto',
		height: 'auto',
		style: Ti.UI.iPhone.ActivityIndicatorStyle.BIG
	});
	
	activity.show();
	
	blackBox.add(activity);
	loadingView.add(blackBox);
	return loadingView;
})();
win1.leftNavButton = listsBtn;
win1.add(taActivityWindow);
taActivityWindow.show();
loadData();

function getFormattedDate(){
    return moment().format('MMM D [at] h:mm A');
}

var tableHeader = Ti.UI.createView({
    backgroundColor:'#e2e7ed',
    width:'100%', height:60
});

var border = Ti.UI.createView({
    backgroundColor:'#576c89',
    bottom:0,
    height:1
});
tableHeader.add(border);

var reloadView = Ti.UI.createView({
	width: 240,
	height: '100%'
});
 
var imageArrow = Ti.UI.createImageView({
    image:'/images/pullToRefresh.png',
    bottom:10, left: 0,
    width:25, height:53
});
reloadView.add(imageArrow);
 
var labelStatus = Ti.UI.createLabel({
    color:'#576c89',
    font:{fontSize:13, fontWeight:'bold'},
    text:'Pull down to refresh...',
    textAlign:'center',
   	bottom:30,
    width:220,
    right: 0
});
reloadView.add(labelStatus);

var labelLastUpdated = Ti.UI.createLabel({
    color:'#576c89',
    font:{fontSize:12},
    text:'Last Updated: ' + getFormattedDate(),
    textAlign:'center',
    bottom:15,
    width:220,
    right: 0
});
labelLastUpdated.lastUpdateDate = null;
reloadView.add(labelLastUpdated);
 
var actInd = Ti.UI.createActivityIndicator({
    left:0, bottom:13,
    width:30, height:30,
    style: Ti.UI.iPhone.ActivityIndicatorStyle.DARK
});
reloadView.add(actInd);
tableHeader.add(reloadView);

tableview.setHeaderPullView(tableHeader);
 
var pulling = false;
var reloading = false;
var offset = 0;
 
tableview.addEventListener('scroll',function(e){
	resetSwipedRow();
    offset = e.contentOffset.y;
    if (pulling && !reloading && offset > -80 && offset < 0){
        pulling = false;
        var unrotate = Ti.UI.create2DMatrix();
        imageArrow.animate({transform:unrotate, duration:180});
        labelStatus.text = 'Pull down to refresh...';
    } else if (!pulling && !reloading && offset < -80){
        pulling = true;
        var rotate = Ti.UI.create2DMatrix().rotate(180);
        imageArrow.animate({transform:rotate, duration:180});
        labelStatus.text = 'Release to refresh...';
    }
});

tableview.addEventListener('click', function(e) {
	if (e.source.isAction) {
		// do the action from the swipeView
		
	} else if (currRow != null && currRow != e.rowData) {
		resetSwipedRow();
	} else if (currRow == null) {
		// open the link...
		Ti.Platform.openURL(e.rowData.hnrow.link);
	}
});

function resetPullHeader(table){
    reloading = false;
    labelLastUpdated.text = 'Last Updated: ' + getFormattedDate();
    labelLastUpdated.lastUpdateDate = new Date();
    actInd.hide();
    imageArrow.transform=Ti.UI.create2DMatrix();
    imageArrow.show();
    labelStatus.text = 'Pull down to refresh...';
    table.setContentInsets({top:0}, {animated:true});
}

Ti.App.addEventListener('resume', function() {
	if (labelLastUpdated.lastUpdateDate == null || labelLastUpdated.lastUpdateDate.getTime() - new Date().getTime() > 60*60*1000) {
		taActivityWindow.show();
		loadData();
	}
});
 
tableview.addEventListener('dragEnd',function(e){
    if (pulling && !reloading && offset < -80){
        pulling = false;
        reloading = true;
        labelStatus.text = 'Updating...';
        imageArrow.hide();
        actInd.show();
        e.source.setContentInsets({top:80}, {animated:true});
        loadData();
    }
});


// var copiedModal = (function() {
	// var alertView = Ti.UI.createView({
		// width: '100%',
		// height: '100%',
		// backgroundColor: 'transparent',
		// visible: false,
		// zIndex: 45
	// }), blackBox = Ti.UI.createView({
		// backgroundColor: '#000',
		// opacity: 0.6,
		// width: 0,
		// height: 0,
		// top: '40%',
		// left: 120,
		// borderRadius: 10,
		// layout: 'vertical'
	// });
// 			
	// blackBox.add(Ti.UI.createImageView({
		// image: '/images/urlWhite.png'
	// }));
	// blackBox.add(Ti.UI.createLabel({
		// text: 'Copied',
		// color: '#fff',
		// font: {fontSize: 12}
	// }));
	// alertView.add(blackBox);
// 	
	// alertView.reveal = function() {
		// alertView.show();
		// blackBox.animate({
			// width: 80,
			// height: 80,
			// duration: 200
		// }, function() {
			// setTimeout(function() {
				// blackBox.animate({
					// width: 0,
					// height: 0,
					// duration: 200
				// });
				// alertView.hide();
			// }, 5000);
		// });
	// };
// 	
	// return alertView;
// })();

win1.add(tableview);
var rootWin = Ti.UI.createWindow();
var nav = Ti.UI.iPhone.createNavigationGroup({
	window: win1
});
rootWin.add(nav);
rootWin.open();

// 
// // create tab group
// var tabGroup = Titanium.UI.createTabGroup();
// 
// 
// //
// // create base UI tab and root window
// //
// 
// var tab1 = Titanium.UI.createTab({  
    // icon:'KS_nav_views.png',
    // title:'Tab 1',
    // window:win1
// });
// 
// win1.add(tableview);
// 
// //
// // create controls tab and root window
// //
// var win2 = Titanium.UI.createWindow({  
    // title:'Tab 2',
    // backgroundColor:'#fff'
// });
// var tab2 = Titanium.UI.createTab({  
    // icon:'KS_nav_ui.png',
    // title:'Tab 2',
    // window:win2
// });
// 
// var label2 = Titanium.UI.createLabel({
	// color:'#999',
	// text:'I am Window 2',
	// font:{fontSize:20,fontFamily:'Helvetica Neue'},
	// textAlign:'center',
	// width:'auto'
// });
// 
// win2.add(label2);
// 
// 
// 
// //
// //  add tabs
// //
// tabGroup.addTab(tab1);  
// tabGroup.addTab(tab2);  
// 
// 
// // open tab group
// tabGroup.open();

//win1.open();
