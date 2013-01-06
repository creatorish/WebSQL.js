/*****************************************************************
 *
 * WebSQL.js
 * Web SQL Databaseを使いやすくするライブラリ
 *
 * License: MIT
 * Update: 2013/01/06
 * Version: 0.1
 * Author: yuu.creatorish
 * URL: http://creatorish.com
 * PluginURL: http://creatorish.com/lab/
 *
*******************************************************************/
(function() {
	var WebSQL = function(op) {
		this.DefaultSetting = {
			id: "websql",
			version: "1",
			name: "websql",
			size: 8*1024*1024,
			strict: true,
			debug: false
		};
		this.setting = this._extend({},this.DefaultSetting,op);
		if (!WebSQL.isSupport ()) {
			this._log("WebSQL: Not support openDatabase.",true);
			return false;
		}
		this.db = window.openDatabase(this.setting.id, this.setting.version, this.setting.name, this.setting.size);
		this._log("WebSQL: Open database (" + this.setting.name + ")");
		this.wait = false;
		this.stopped = false;
		this.queue = [];
	};
	WebSQL.isSupport = function() {
		if (typeof window.openDatabase === "undefined") {
			return false;
		}
		return true;
	};
	WebSQL.SQL = {
		createTable: function(tableName,value,exists) {
			if (typeof value === "object") {
				value = this._arrayToString(value);
			}
			var sql = "CREATE TABLE";
			if (exists) {
				sql += " IF NOT EXISTS";
			}
			sql += " " + tableName + "(" + value + ");";
			return sql;
		},
		insert: function(tableName,value) {
			var sql = "INSERT INTO " + tableName + " ";
			value = this._objectToString(value);
			sql += "(" + value.key + ") VALUES(" + value.value + ");";
			return sql;
		},
		update: function(tableName,value,option) {
			var sql = "UPDATE " + tableName + " SET ";
			value = this._objectToArrays(value);
			for (var i = 0; i < value.key.length;i++) {
				if (i !== 0) {
					sql += ",";
				}
				sql += value.key[i] + "=" + value.value[i];
			}
			if (option) {
				sql += " " + option;
			}
			sql += ";";
			return sql;
		},
		select: function(tableName,option) {
			var sql = "SELECT * FROM " + tableName;
			if (option) {
				sql += " " + option;
			}
			sql += ";";
			return sql;
		},
		delete: function(tableName,option) {
			var sql = "DELETE FROM " + tableName;
			if (option) {
				sql += " " + option;
			}
			sql += ";";
			return sql;
		} ,
		dropTable: function(tableName) {
			var sql = "DROP TABLE " + tableName + ";";
			return sql;
		},
		_arrayToString: function(arr) {
			var val = "";
			for (var i = 0; i < arr.length; i++) {
				if (i !== 0) {
					val += ",";
				}
				val += "'" + arr[i] + "'";
			}
			return val;
		},
		_objectToArrays: function(obj) {
			var params = [];
			var values = [];
			for (var key in obj) {
				params.push(key);
				values.push("'" + obj[key] + "'");
			}
			return {
				key: params,
				value: values
			};
		},
		_objectToString: function(obj) {
			var arr = this._objectToArrays(obj);
			arr.key = arr.key.toString();
			arr.value = arr.value.toString();
			return arr;
		}
	};
	WebSQL.prototype = {
		changeVersion: function(newVersion,callback,errorCallback,voidCallback) {
			callback = this_createCallback(callback,errorCallback,voidCallback)
			this.db.changeVersion(this.setting.version,newVersion,callback.callback,callback.errorCallback,callback.voidCallback);
		},
		transaction: function(callback,errorCallback,voidCallback) {
			callback = this._createCallback(callback,errorCallback,voidCallback);
			if (this.wait) {
				this.queue.push(callback);
				return this;
			}
			var self = this;
			var to = null;
			self.wait = true;

			this.db.transaction(function(ts) {
				to = ts;
				self._log("WebSQL: Start transaction.");
				if (typeof callback.callback === "function") {
					callback.callback.apply(self,[new WebSQLTransaction(to)]);
				}
			}, function(e) {
				self._log("WebSQL: Transaction error." + e.message,true);
				if (typeof callback.errorCallback === "function") {
					callback.errorCallback.apply(self,[e]);
				}
				if (!self.setting.strict) {
					self._checkQueue();
				}
			}, function(ts) {
				self._log("WebSQL: Transaction success.");
				if (typeof callback.voidCallback === "function") {
					callback.voidCallback.apply(self,[to]);
				}
				self._checkQueue(to);
			});
			return this;
		},
		executeSql: function(sql,callback,errorCallback) {
			callback = this._createCallback(callback,errorCallback);
			this._log("WebSQL: Execute SQL (" + sql + ")");
			this.transaction(function(ts) {
				ts.executeSql(sql,function(ts,result) {
					ts.returnValue = result;
				});
			},function(e) {
				this._log("WebSQL: SQL Error (" + e.message + ")" );
				if (typeof callback.errorCallback === "function") {
					callback.errorCallback.apply(this,[e]);
				}
			},function(ts) {
				if (typeof callback.callback === "function") {
					callback.callback.apply(this,[ts.returnValue]);
				}
			});
			return this;
		},
		createTable: function(tableName,value,exists,callback,errorCallback) {
			callback = this._createCallback(callback,errorCallback);
			this.executeSql(WebSQL.SQL.createTable(tableName,value,exists), callback);
			return this;
		},
		insert: function(tableName,value,callback,errorCallback) {
			callback = this._createCallback(callback,errorCallback);
			this.executeSql(WebSQL.SQL.insert(tableName,value), callback);
			return this;
		},
		update: function(tableName,value,option,callback,errorCallback) {
			callback = this._createCallback(callback,errorCallback);
			this.executeSql(WebSQL.SQL.update(tableName,value,option), callback);
			return this;
		},
		select: function(tableName,option,callback,errorCallback) {
			callback = this._createCallback(callback,errorCallback);
			this.executeSql(WebSQL.SQL.select(tableName,option), callback);
			return this;
		},
		delete: function(tableName,option,callback,errorCallback) {
			callback = this._createCallback(callback,errorCallback);
			this.executeSql(WebSQL.SQL.delete(tableName,option), callback);
			return this;
		} ,
		dropTable: function(tableName,callback,errorCallback) {
			callback = this._createCallback(callback,errorCallback);
			this.executeSql(WebSQL.SQL.dropTable(tableName), callback);
			return this;
		},
		then: function(callback,errorCallback) {
			callback = this._createCallback({
				errorCallback: errorCallback,
				voidCallback: callback
			});
			if (this.wait) {
				this.queue.push(callback);
			} else {
				callback.apply(callback);
			}
			return this;
		},
		stop: function() {
			this._log("WebSQL: Stop queue.");
			this.stopped = true;
			return this;
		},
		next: function() {
			this._log("WebSQL: Next queue.");
			this._checkQueue();
			return this;
		},
		cancel: function() {
			this._log("WebSQL: Cancel queue.");
			this.stop();
			this.queue = [];
			return this;
		},
		_log: function(message,isError) {
			if (isError) {
				window.console.error(message);
			} else if (this.setting.debug) {
				window.console.log(message);
			}
		},
		_createCallback: function(callback,errorCallback,voidCallback) {
			if(typeof callback === "object") {
				return callback;
			}
			var cb = {
				callback: null,
				errorCallback: null,
				voidCallback: null
			};
			if (callback) {
				cb.callback = callback;
			}
			if (errorCallback) {
				cb.errorCallback = errorCallback;
			}
			if (voidCallback) {
				cb.voidCallback = voidCallback;
			}
			return cb;

		},
		_extend: function(arg) {
			if (arguments.length < 2) {
				return arg;
			}
			if (!arg) {
				arg = {};
			}
			for (var i = 1; i < arguments.length; i++) {
				for (var key in arguments[i]) {
					if (arguments[i][key] !== null && typeof(arguments[i][key]) === "object") {
						arg[key] = this._extend(arg[key],arguments[i][key]);
					} else {
						arg[key] = arguments[i][key];
					}
				}
			}
			return arg;
		},
		_checkQueue: function(to) {
			this.wait = false;
			if (this.queue.length !== 0 && !this.stopped) {
				var q = this.queue.shift();
				if (!q.callback) {
					q.voidCallback.apply(this,[to.returnValue]);
				} else {
					this.transaction(q.callback,q.errorCallback,q.voidCallback);
				}
			}
			this.stopped  = false;
		}
	};

	var WebSQLTransaction = function(ts) {
		this.qst = ts;
		this.qst._executeSql = ts.executeSql;
		this.qst.executeSql = this.executeSql;
		return this.qst;
	};
	WebSQLTransaction.prototype = {
		executeSql: function(sql,val,callback) {
			if (typeof val === "function") {
				callback = val;
				val = null;
			}
			this._executeSql(sql,val,callback);
		}
	};
	if (!window.WebSQL) {
		window.WebSQL = WebSQL;
	}
})();