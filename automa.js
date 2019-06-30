automa = {};

automa.NumberGrid = function(width, height) {
	var cells = [];
	
	//Delete the value at x, y
	this.Delete = function(x, y) {
		if (x < 0 || x >= width || y < 0 || y >= height) return null;
		delete cells[y * width + x];
		return true;
	}
	
	//Set the value at x, y
	this.Set = function(x, y, value) {
		if (x < 0 || x+1 >= width || y < 0 || y >= height) return null;
		cells[y * width + x] = value;
	}
	
	this.setAtIndex = function(i, value) {
		cells[i] = value;
	}
	
	//Increment the value at x, y
	this.Increment = function(x, y) {
		if (x < 0 || x >= width || y < 0 || y >= height) return null;
		var i = y * width + x;
		if (cells[i] === undefined) {
			cells[i] = 1;
		}
		else {
			cells[i] +=1;
		}
	}
	
	//Get the value at x, y
	this.Get = function(x, y, def) {
		if (x < 0 || x >= width || y < 0 || y >= height) return null;
		var v = cells[y * width + x];
		if (v === undefined) return def;
		return v;
	}
	
	this.getByIndex = function(i, def) {
		if (cells[i] === undefined) return def;
		return cells[i];
	}
	
	//apply the value of func(value of x/y) to the value at x/y (if not null).
	this.forCell = function(x, y, func) {
		if (x < 0 || x >= width || y < 0 || y >= height) return null;
		var i = y * width + x;
		var v = cells[i];
		if (v === undefined) v = 0;		
		var val = func(v, i);
		if (val !== undefined) {
			cells[i] = val;
		}
	}
	
	this.forCellIndex = function(i, func) {
		var v = cells[i];
		var y = Math.floor(i / width);
		var x = i - (y * width);
		if (v === undefined) v = 0;
		var val = func(v, x, y);
		if (val !== undefined) {
			cells[i] = val;
		}
	}
	
	//For every index, apply callback(value, x, y, i);
	this.forEach = function(callback) {
		var i;
		var x;
		var y;
		i = x = y = 0;

		for (i = 0; i < width * height; i++) {

			var v = cells[i];
			if (v === undefined) v = 0;
			var val = callback(v, x, y, i);
			if (val !== undefined) {
				cells[i] = val;
			}
			x +=1;
			if (x === width) {
				x = 0;
				y += 1;
			}
		}
	}
	
	this.forEachInterval = function(callback) {
		var i;
		var x;
		var y;
		var interval;		
		var max = width*height;
		i = x = y = 0;
		
		var func = function() {
			if (i === max) {
				clearInterval(interval);
				return;
			}
			i++;
			var v = cells[i];
			if (v === undefined) v = 0;
			var val = callback(v, x, y, i);
			if (val !== undefined) {
				cells[i] = val;
			}
			x +=1;
			if (x === width) {
				x = 0;
				y += 1;
			}
		}	
		interval = setInterval(func, 1);
	}
	
	//For all indecies adjacent to x, y, apply callback(value, x, y);
	this.forEachAdjacent = function(x, y, callback) {
		this.forCell(x - 1, y - 1, callback);
		this.forCell(x - 1, y, callback);
		this.forCell(x - 1, y + 1, callback);
		this.forCell(x, y - 1, callback);
		this.forCell(x, y + 1, callback);
		this.forCell(x + 1, y - 1, callback);
		this.forCell(x + 1, y, callback);
		this.forCell(x + 1, y + 1, callback);	
	}
	
	this.getData = function() {
		return cells;
	}
}

automa.Life = function(state, adjacency) {

	if (state == 0 && adjacency === 3) {
		return 1;
	}
	if (state === 1 && (adjacency === 2 || adjacency === 3)) {
		return 1;
	}
	return 0;
} 

automa.Game = function(width, height) {
	var me = this;
	var cells = new automa.NumberGrid(width, height);
	var adjacencies = new automa.NumberGrid(width, height);
	
	
	this.onCellChange = function(){};
	
	this.Clear = function() {
		//cells = new automa.NumberGrid(width, height);
		//adjacents = new automa.NumberGrid(width, height);
		cells.forEach(function(value, x, y) {
			me.onCellChange(0, x, y);
			return 0;
		});
		adjacencies = new automa.NumberGrid(width, height);
	}
	
	this.DoGeneration = function(rule_callback) {
	
		var cell_changes = new automa.NumberGrid(width, height);
		var adj_changes = new automa.NumberGrid(width, height);
		
		cells.forEach(function(value, x, y, i) {

			var adj = adjacencies.getByIndex(i);
			if (value === undefined) value = 0;
			var change = rule_callback(value, adj);
			
			if (change !== value) {
				cell_changes.setAtIndex(i, change);
				
				if (value == 0 || change == 0) {
					adj_changes.forEachAdjacent(x, y, function(nadj, i) {
						if (nadj === undefined) nadj === 0;
						if (change === 0) {
							return nadj - 1;
						}
						else {
							return nadj + 1;
						}
					});
				}
				
				me.onCellChange(change, x, y);
			}
		});
		
		cells.forEach(function(value, x, y, i) {
			adjacencies.setAtIndex(i, adjacencies.getByIndex(i, 0) + adj_changes.getByIndex(i, 0));
			
			return cell_changes.getByIndex(i);
		});
	}
	
	this.Set = function(x, y, newvalue) {
		cells.forCell(x, y, function(value, i) {
			if (value === newvalue) return newvalue;
				if (newvalue === 0) {
					adjacencies.forEachAdjacent(x, y, function(a) {
						return a - 1;
					});
				}
				else {
					adjacencies.forEachAdjacent(x, y, function(a) {
						return a + 1;
					});
				}
			me.onCellChange(newvalue, x, y);
			return newvalue;
		});
	}
	
	this.setAtIndex = function(i, newvalue) {
		cells.forCellIndex(i, function(value, x, y) {
			if (value === newvalue) return newvalue;
				if (newvalue === 0) {
					adjacencies.forEachAdjacent(x, y, function(a) {
						return a - 1;
					});
				}
				else {
					adjacencies.forEachAdjacent(x, y, function(a) {
						return a + 1;
					});
				}
			me.onCellChange(newvalue, x, y);
			return newvalue;
		});
	}
	
	this.Get = function(x, y) {
		return cells.Get(x, y, 0);
	}

	this.encodeGrid = function() {
		var inrow = 0;
		var xx, yy;
		var py = 0;
		var singles = [];
		var multiples = []
		
		cells.forEach(function(value, x, y, i) {
			if (value > 0 && py === y) {
				if (!inrow) {
					xx = x;
					yy = y;
				}
				inrow++;
			}
			else {
				if (inrow == 1) {
					singles.push({x: xx, y: yy})
				}
				if (inrow > 1) {
					multiples.push({x: xx, y: yy, n: inrow})
					
				}
				if (inrow > 0) {
					xx = yy = inrow = 0;
				}
			}
			py = y;
		});
		var buffer = new ArrayBuffer(4 + singles.length * 2 + multiples.length * 3);
		var arrayview = new DataView(buffer);
		arrayview.setUint16(0, singles.length)
		arrayview.setUint16(2, multiples.length)

		singles.forEach(function(value, i) {
			var loc = 4 + i * 2;
			arrayview.setUint8(loc, value.x);
			arrayview.setUint8(loc+1, value.y);
		});
		multiples.forEach(function(value, i) {
			var loc = 4 + 2 * singles.length + i * 3;
			arrayview.setUint8(loc, value.x);
			arrayview.setUint8(loc+1, value.y);
			arrayview.setUint8(loc+2, value.n);
		});
		
		return base64js.fromByteArray(new Uint8Array(buffer));
	}

	this.fromEncoding = function(str) {
		var arr = new Uint8Array(base64js.toByteArray(str))
		var arrayview = new DataView(arr.buffer);
		
		var numSingles = arrayview.getUint16(0);
		var numMultiples = arrayview.getUint16(2);

		for (var i = 0; i < numSingles; i++) {
			var loc = 4 + i * 2;
			var x = arrayview.getUint8(loc);
			var y = arrayview.getUint8(loc + 1);
			me.Set(x, y, 1);
		}

		for (var i = 0; i < numMultiples; i++) {
			var loc = 4 + 2 * numSingles + i * 3;
			var x = arrayview.getUint8(loc);
			var y = arrayview.getUint8(loc + 1);
			var n = arrayview.getUint8(loc + 2);
			for (var xx = x; xx < x + n; xx++) {
				me.Set(xx, y, 1)
			}
		}
	}


	this.getWidth = function(){return width;};
	this.getHeight = function(){return height;};
}

automa.Pen = function(game) {
	var mousedown = false;
	var changedlist = [];
	this.gridDown = function() {
		mousedown = true;
	}
	
	this.windowUp = function() {
		mousedown = false;
		$.each(changedlist, function() {
			this.data('changed', false);
		});
		changedlist = [];
	}

	this.mouseCell = function(x, y, v, evt) {	
			 
		if ((mousedown && !$(this).data('changed')) || evt.type==="mousedown") {
			var v = 0;
			if (evt.which === 1) v = 1;
			game.Set(x, y, v);
			$(evt.target).data('changed', true);
			changedlist.push($(evt.target));
		}
	}
}

automa.Display = function(game) {
	var width = game.getWidth();
	var height = game.getHeight();
	
	var cells = new automa.NumberGrid(width, height);
	var grid = document.getElementById("grid");
	
	var tool = new automa.Pen(game);
	
	var row = document.createElement("div");
	
	// Set up events
	game.onCellChange = function(value, x, y) {
		if (value === 1) {
			$(cells.Get(x, y)).addClass("black");
		}
		else {
			$(cells.Get(x, y)).removeClass("black");
		}
	}

	grid.ondragstart = function() {return false;};
	grid.oncontextmenu = function() { return false;};
	grid.onselectstart = function() { return false;};
	
	
	$(grid).mousedown(function() {
		tool.gridDown();
	});
	$(window).mouseup(function() {
		tool.windowUp();
	});
	
	// Create the cells
	var py = 0;
	cells.forEach(function(value, x, y, i) {
		
		var cell = document.createElement("div");
		$(cell).addClass("cell");
		
		if (py < y) {
			grid.appendChild(row);
			row = document.createElement("div");
		}

		$(cell).data('changed', false)
			.click(function(evt){tool.mouseCell(x, y, value, evt)})
			.mousemove(function(evt){tool.mouseCell(x, y, value, evt)});
		
		py = y;
		row.appendChild(cell);
		return cell;
	});
	grid.appendChild(row);
	
	this.Clear = function() {
		$(".cell").removeClass("black");
	}
	
	this.setCellSize = function(size) {
		$(".cell").width(size).height(size);
		$("#grid > div").height(size);
	}	
}


$(function() {
	
	var load = function() {
		var game = new automa.Game(100, 100);
		new automa.Display(game);

		var ticker;
		$("#go").click(function(e) {
			if (!ticker) {
				
				ticker = setInterval(function() {
					game.DoGeneration(automa.Life);
				}, 100);
				$("#play_text").text("Pause");
				$("#play_img").attr('src', "control_pause.png");
			}
			else {
				clearInterval(ticker);
				ticker = null;
				$("#play_img").attr('src', "control_play.png");
				$("#play_text").text("Start");
			}
		});
		
		$("#next").click(function() {
			game.DoGeneration(automa.Life);
		});
	
		$("#clear").click(function() {
			game.Clear();
			$("#play_text").text("Start");
			clearInterval(ticker);
			ticker = null;
		});
		
		$("#geturl").click(function() {
			$("#gameurl").val(document.URL.split("?")[0]+'?board='+game.encodeGrid());
		});	
		var querystr = document.URL.split("?board=")[1];
		if (querystr) game.fromEncoding(querystr);
		
		$("#loading").toggle();
	}

	setTimeout(load, 10);
});
