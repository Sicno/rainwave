var edi = function() {
	var that = {};
	var layouts = [];
	var clayout = false;
	var oldurl = location.href;
	var urlhistory = [];
	that.openpanels = {};
	
	that.urlChangeDetect = function() {
		if (oldurl != location.href) {
			var i = parseInt(location.href.substring(location.href.indexOf("#") + 1));
			if (urlhistory[i]) {
				that.openPanelLink(urlhistory[i].panel, urlhistory[i].link);
			}
			oldurl = location.href;
		}
	};
	
	that.openPanelLink = function(panel, link) {
		if (link.history) {
			delete(link.history);
			urlhistory.push({ "panel": panel, "link": link });
			if (location.href.indexOf("#") >= 0) oldurl = location.href.substring(0, location.href.indexOf("#")) + "#" + (urlhistory.length - 1);
			else oldurl = location.href + "#" + (urlhistory.length - 1);
			location.href = oldurl;
		}
		if (typeof(openpanels[panel]) != "undefined") {
			openpanels[panel].openLink(link);
			return;
		}
		for (i in openpanels) {
			if (openpanels[i].mpi) {
				if (openpanels[i].openPanelLink(panel, link)) 
					return;
			}
		}
	};
	
	// NEEDS TO BE RE-CODED for new layouts format
	/*	that.loadLayouts = function() {
		var c = prefs.loadCookie("edilayouts");
		for (var l in c) {
			if (c[l].length > 0) layouts[l] = new Array();
			for (var row = 0; row < c[l].length; row++) {
				layouts[l][row] = [];
				for (var p in c[l][row]) {
					if (panels[c[l][row][p]]) {
						layouts[i][row].push(panels[c][l][row][p]);
					}
				}
			}
		}
	};
	
	that.saveLayouts = function() {
		var c = new Array();
		for (var l in layouts) {
			if (layouts[l].length > 0) c[l] = new Array();
			for (var row = 0; row < layouts[l].length; row++) {
				c[l][row] = [];
				for (var p in layouts[l][row]) {
					c[l][row].push(p);
				}
			}
		}
		prefs.saveCookie("edilayouts", c);
	};*/

	that.init = function(container) {
		//that.loadLayouts();
		layouts['default'] = [
			[ { "panel": "MenuPanel", "rowspan": 1, "colspan": 2 } ],
			[ { "panel": "TimelinePanel", "rowspan": 2, "colspan": 1 }, { "panel": "NowPanel", "rowspan": 1, "colspan": 1 } ],
			[ false, { "panel": "MainMPI", "rowspan": 1, "colspan": 1 } ]
		];
		clayout = layouts['default'];
		for (var i in panels) {
			panels[i].EDINAME = i;
		}
		
		that.sizeLayout();
		that.drawGrid(container);
		
		setInterval(that.urlChangeDetect, 200);
	};
	
	//*************************************************************************
	// Sizing/drawing layouts
	
	var colw = [];
	var colx = [];
	var rowh = [];
	var rowy = [];
	var mincolw = [];
	var minrowh = [];
	var colflags = [];
	var rowflags = [];
	var table = [];
	var layout = [];
	var vborders = [];
	var hborders = [];
	var cborders = [];

	that.sizeLayout = function() {
		var maxcols = 0;
		for (var i = 0; i < clayout.length; i++) {
			rowh[i] = 0;
			minrowh[i] = 0;
			if (clayout[i].length > maxcols) maxcols = clayout[i].length;
		}

		for (var j = 0; j < maxcols; j++) {
			colw[j] = 0;
			mincolw[j] = 0;
		}
		
		// Step 1: Find out the normal width/height for each column and row and the minimum width/height
		for (var i = 0; i < clayout.length; i++) {
			layout[i] = [];
			for (var j = 0; j < clayout[i].length; j++) {
				if (!clayout[i][j]) {
					layout[i][j] = false;
					continue;
				}
				layout[i][j] = panels[clayout[i][j].panel];
				layout[i][j].rowspan = clayout[i][j].rowspan;
				layout[i][j].colspan = clayout[i][j].colspan;
				layout[i][j].row = i;
				layout[i][j].column = j;
				if (layout[i][j].rowspan == 1) {
					if (rowh[i] < layout[i][j].height) rowh[i] = layout[i][j].height;
					if (minrowh[i] < layout[i][j].minheight) minrowh[i] = layout[i][j].minheight;
				}
				if (layout[i][j].colspan == 1) {
					if (colw[j] < layout[i][j].width) colw[j] = layout[i][j].width;
					if (mincolw[j] < layout[i][j].minwidth) mincolw[j] = layout[i][j].minwidth;
				}
			}
		}
		
		// Step 2: Get how large our current layout is
		var ediwidth = 0;
		var ediheight = 0;
		for (var i = 0; i < layout.length; i++) {
			ediheight += rowh[i];
		}
		for (var j = 0; j < maxcols; j++) {
			ediwidth += colw[j];
		}

		// Step 3: Shrink or expand panels to fit screen
		var xbudget = window.innerWidth - ediwidth;
		var ybudget = window.innerHeight - ediheight;
		
		// Find out which columns and rows are slackable or maxable
		for (var i = 0; i < layout.length; i++) rowflags[i] = "slack";
		for (var j = 0; j < maxcols; j++) colflags[j] = "slack";
		for (var i = 0; i < layout.length; i++) {
			for (var j = 0; j < layout[i].length; j++) {
				if (typeof(layout[i][j]) != "object") continue;
				// Fixed always takes precedence
				if ((rowflags[i] == "fixed") || (layout[i][j].ytype == "fixed")) {
					rowflags[i] = "fixed";
				}
				// max is second in command
				else if ((rowflags[i] == "max") || (layout[i][j].ytype == "max")) {
					rowflags[i] = "max";
				}
				// if we have a fit column, do not use slack space
				else if ((rowflags[i] == "fit") || (layout[i][j].ytype == "fit")) {
					rowflags[i] = "fit";
				}
				// slack is the default flag as a last resort

				if ((colflags[j] == "fixed") || (layout[i][j].xtype == "fixed")) {
					colflags[j] = "fixed";
				}
				else if ((colflags[j] == "max") || (layout[i][j].xtype == "max")) {
					colflags[j] = "max";
				}
				else if ((colflags[j] == "fit") || (layout[i][j].xtype == "fit")) {
					colflags[j] = "fit";
				}
			}
		}
		
		colw = that.getGridSize(colw, mincolw, colflags, xbudget, theme.borderwidth);
		rowh = that.getGridSize(rowh, minrowh, rowflags, ybudget, theme.borderheight);
	};
	
	that.drawGrid = function(element) {
		for (var i = 0; i < layout.length; i++) {
			vborders[i] = new Array();
			hborders[i] = new Array();
			//cborders[i] = new Array();
		}
		var runningy = 0;
		for (var i = 0; i < layout.length; i++) {
			var runningx = 0;
			var borderheight = theme.borderheight;
			for (var j = 0; j < layout[i].length; j++) {
				if (!layout[i][j]) {
					var cellwidth = (layout[i - 1][j].colspan - 1) * theme.borderwidth;
					for (var k = j; k <= (j + layout[i - 1][j].colspan - 1); k++) {
						cellwidth += colw[k];
					}
					runningx += cellwidth + theme.borderwidth;
					continue;
				}
				
				var usevborder = false;
				var usehborder = false;
				var borderwidth = theme.borderwidth;
				var cirregular = (layout[i][j].colspan > 1) || (layout[i][j].colspan > 1) ? true : false;
				if ((j + layout[i][j].colspan) < colflags.length) usevborder = true;
				if ((i + layout[i][j].rowspan) < layout.length) usehborder = true;
				if (panels[layout[i][j].EDINAME].noborder) {
					//usevborder = false;
					usehborder = false;
					//borderwidth = Math.floor(borderwidth / 2);
					borderheight = Math.floor(borderheight / 2);
					rowh[rowh.length - 1] += borderheight;
				}
				
				var cellwidth = (layout[i][j].colspan - 1) * theme.borderwidth;
				for (var k = j; k <= (j + layout[i][j].colspan - 1); k++) cellwidth += colw[k];
				var cellheight = (layout[i][j].rowspan - 1) * theme.borderheight;
				for (var k = i; k <= (i + layout[i][j].rowspan - 1); k++) cellheight += rowh[k];
				
				var dispwidth = (typeof(layout[i][j].initSizeX) == "function") ? layout[i][j].initSizeX(cellwidth, colw[j]) : cellwidth;
				var dispheight = (typeof(layout[i][j].initSizeY) == "function") ? layout[i][j].initSizeY(cellheight, rowh[i]) : cellheight;
				if ((dispwidth != cellwidth) || (dispheight != cellheight)) cirregular = true;

				if (usevborder) {
					vborders[i][j] = {};
					vborders[i][j].el = createEl("div", { "class": "edi_border_vertical" });
					vborders[i][j].el.setAttribute("style", "position: absolute; top: " + runningy + "px; left: " + (runningx + dispwidth) + "px; height: " + cellheight + "px;");
					vborders[i][j].vfirst = (i == 0) ? true : false;
					vborders[i][j].vlast = ((i + (layout[i][j].rowspan - 1)) >= (rowflags.length - 1)) ? true : false;
					var crap = function() {
						var h = j - 1;
						vborders[i][j].el.addEventListener('mousedown', function(e) { that.startColumnResize(e, h + 1); }, true);
					}();
					if (theme.borderVertical) theme.borderVertical(vborders[i][j]);
					element.appendChild(vborders[i][j].el);
				}
				
				if (usehborder) {
					hborders[i][j] = {}
					hborders[i][j].el = createEl("div", { "class": "edi_border_horizontal" });
					hborders[i][j].el.setAttribute("style", "position: absolute; top: " + (runningy + cellheight) + "px; left: " + runningx + "px; width: " + cellwidth + "px;");
					hborders[i][j].hfirst = (j == 0) ? true : false;
					hborders[i][j].hlast = (j >= (layout[i].length - 1)) ? true : false;
					var crap = function() {
						var h = i - 1;
						hborders[i][j].el.addEventListener('mousedown', function(e) { that.startRowResize(e, h + 1); }, true);
					}();
					if (theme.borderHorizontal) theme.borderHorizontal(hborders[i][j]);
					element.appendChild(hborders[i][j].el);
				}
				
				var panelel = document.createElement("div");
				panelel.setAttribute("style", "position: absolute; top: " + runningy + "px; left:" + runningx + "px; width: " + dispwidth + "px; height: " + dispheight + "px;");
				that.openpanels[layout[i][j].EDINAME] = layout[i][j].constructor(panelel);
				var panelcl = layout[i][j].EDINAME;
				panelcl = panelcl.replace(" ", "_");
				panelel.setAttribute("class", "EdiPanel Panel_" + panelcl);
				element.appendChild(panelel);
				that.openpanels[layout[i][j].EDINAME].init();
				
				that.openpanels[layout[i][j].EDINAME]._row = i;
				that.openpanels[layout[i][j].EDINAME]._column = j;
				that.openpanels[layout[i][j].EDINAME]._runningx = runningx;
				that.openpanels[layout[i][j].EDINAME]._runningy = runningy;
				that.openpanels[layout[i][j].EDINAME]._div = panelel;
				
				runningx += cellwidth + borderwidth;
			}
		runningy += rowh[i] + borderheight;
		}
		
		for (i = 0; i < layout.length; i++) {
			for (j = 0; j < layout[i].length; j++) {
				if (typeof(layout[i][j]) != "object") continue;
				if (that.openpanels[layout[i][j].EDINAME].onLoad) that.openpanels[layout[i][j].EDINAME].onLoad();
			}
		}
		
		/*for (var i = 0; i < (layout.length - 1); i++) {
			for (var j = 0; j < (layout[i].length - 1); j++) {
				if (typeof(cborders[i][j]) != "object") continue;
				theme.borderCorner(cborders[i][j]);
			}
		}*/
	};
	
	that.getGridSize = function(sizes, minsizes, flags, budget, bordersize) {
		budget -= bordersize * (sizes.length - 1);
	
		// Find out how many max/slack cells we have
		var nummax = 0;
		var numslack = 0;
		for (var j = 0; j < flags.length; j++) {
			if (flags[j] == "max") nummax++;
			else if (flags[j] == "slack") numslack++;
		}

		// If we've got width to spare, let's maximize any cells
		if ((budget > 0) && (nummax > 0)) {
			var addwidth = Math.floor(budget / nummax);
			var spare = budget - addwidth;		// catch rounding errors!
			for (var j = 0; j < flags.length; j++) {
				if (flags[j] == "max") {
					sizes[j] += addwidth + spare;
					budget -= addwidth - spare;
					spare = 0;
				}
			}
		}
		// Shrink or expand slack space if available
		if ((budget != 0) && (numslack > 0)) {
			var addwidth = Math.floor(budget / numslack);
			var spare = budget - addwidth;
			for (var j = 0; j < flags.length; j++) {
				if (flags[j] == "slack") {
					if ((sizes[j] + addwidth + spare) < minsizes[j]) {
						budget -= (sizes[j] - minsizes[j]);
						sizes[j] = minsizes[j];
					}
					else {
						sizes[j] += (addwidth + spare);
						budget -= (addwidth + spare);
						spare = 0;
					}
				}
			}
		}
		// Shrink all columns.
		if (budget < 0) {
			// Add up the minimum attainable width
			var minwidthtotal = 0;
			for (var j = 0; j < minsizes.length; j++) minwidthtotal += minsizes[j];
			// If minimum width is <= available width, we can shrink some of our columns without doing any sacrifices.
			if (minwidthtotal <= window.innerWidth) {
				var shrinkable = 1;
				var lastshrink = window.innerWidth;
				while ((budget < 0) && (shrinkable > 0)) {
					var largestmin = 0;
					shrinkable = 0;
					for (var j = 0; j < sizes.length; j++) {
						if ((sizes[j] > minsizes[j]) && (lastshrink > minsizes[j])) {
							largestmin = minsizes[j];
							lastshrink = minsizes[j];
						}
					}
					var gain = 0;
					for (var j = 0; j < sizes.length; j++) {
						if ((sizes[j] > minsizes[j]) && (minsizes[j] <= largestmin)) {
							shrinkable++;
							gain += (sizes[j] - largestmin);
						}
					}
					if (gain > Math.abs(budget)) gain = Math.abs(budget);
					if (shrinkable > 0) {
						var shrinkeach = Math.floor(gain / shrinkable);
						var spare = gain - (shrinkeach * shrinkable);
						for (var j = 0; j < sizes.length; j++) {
							if ((sizes[j] > minsizes[j]) && (minsizes[j] <= largestmin)) {
								sizes[j] -= shrinkeach - spare;
								spare = 0;
								budget += shrinkeach + spare;
							}
						}
					}
				}
			}
			
			if (budget < 0) {
				// Find out how much other space can be squeezed evenly out of the other columns
				var shrinkable = 0;
				for (var j = 0; j < sizes.length; j++) {
					if (flags[j] != "fixed") shrinkable++;
				}
				var subwidth = Math.floor(Math.abs(budget) / shrinkable);
				var spare = Math.abs(budget) - (subwidth * shrinkable);
				for (var j = 0; j < sizes.length; j++) {
					if (flags[j] != "fixed") {
						sizes[j] -= subwidth - spare;
						budget += subwidth + spare;
						spare = 0;
					}
				}
			}
		}
		
		return sizes;
	};
	
	//*************************************
	//  Resizing
	
	var resize_mx;
	var resize_my;
	var resize_row = false;
	var resize_col = false;
	var resize_last_width = -1;
	var resize_last_height = -1;
	
	that.startRowResize = function(evt, row) {
	};
	
	that.rollingRowResize = function(evt) {
	};
	
	that.stopRowResize = function(evt) {
	};
	
	that.startColumnResize = function(evt, col) {
		if (resize_col !== false) return;
		resize_mx = getMousePosX(evt);
		resize_col = col;
		resize_last_width = colw[col];
		document.addEventListener("mousemove", that.rollingColumnResize, false);
		document.addEventListener("mouseup", that.stopColumnResize, false);
	};
	
	that.rollingColumnResize = function(evt) {
		var mx = getMousePosX(evt);
		var width = colw[resize_col] + (mx - resize_mx);
		if (width < mincolw[resize_col]) width = mincolw[resize_col];
		if (resize_last_width == width) return;
		var width2 = colw[resize_col + 1] - (width - colw[resize_col]);
		if (width2 < mincolw[resize_col + 1]) {
			// this if catches a condition where mincolw[resize_col + 1] will expand to cause width to be < mincolw[resize_col]
			if ((width + (mincolw[resize_col + 1] - width2)) < mincolw[resize_col]) return;
			width += width2 - mincolw[resize_col + 1];
			width2 = mincolw[resize_col + 1];
		}
		var coldiff = width - colw[resize_col];
		var coldiff2 = width2 - colw[resize_col + 1];
		var x2;
		for (var i = 0; i < layout.length; i++) {
			if (typeof(layout[i][resize_col]) != "undefined") {
				if (that.resizeColumnOK(i, resize_col)) {
					vborders[i][resize_col].el.style.left = width + "px";
					that.openpanels[layout[i][resize_col].EDINAME]._div.style.width = width + "px";
				}
			}
			if (typeof(layout[i][resize_col + 1]) != "undefined") {
				if (that.resizeColumnOK(i, resize_col + 1)) {
					x2 = that.openpanels[layout[i][resize_col + 1].EDINAME]._runningx - coldiff2;
					that.openpanels[layout[i][resize_col + 1].EDINAME]._div.style.left = x2 + "px";
					that.openpanels[layout[i][resize_col + 1].EDINAME]._div.style.width = width2 + "px";
				}
			}
		}
		resize_last_width = width;
	};
	
	that.resizeColumnOK = function(row, col) {
		if (layout[row][col].colspan != 1) return false;
		return true;
	}
	
	
	that.stopColumnResize = function(evt) {
		var coldiff = resize_last_width - colw[resize_col];
		colw[resize_col] = resize_last_width;
		colw[resize_col + 1] = colw[resize_col + 1] - coldiff;
		for (var i = 0; i < layout.length; i++) {
			if (typeof(layout[i][resize_col + 1]) != "undefined") {
				that.openpanels[layout[i][resize_col + 1].EDINAME]._runningx += coldiff;
			}
		}
		document.removeEventListener("mousemove", that.rollingColumnResize, false);
		document.removeEventListener("mouseup", that.stopColumnResize, false);
		resize_col = false;
	};
		
	return that;
}();