WebSQL.js
======================
Web SQL Databaseを使いやすくするライブラリ
WebSQLDatabaseAPI1は既にW3Cからは策定除外されています。

デモ
------
http://dev.creatorish.com/demo/websql/

使い方
------

### データベースを開く ###

    var db = new WebSQL('sample', '0.1', 'サンプルデータベース', 1048576);

    new WebSQL('データベース名', 'バージョン', 'データベースの名称', データベース容量);

※全て省略可能です。

■デフォルト値

+    データベース名: "websql"
+    バージョン: "1"
+    データベース名: "websql"
+    データベース容量: 8 * 1024 * 1024

### 便利関数 ###

#### テーブルの作成 ####

    db.createTable("テーブル名",カラム名を配列で,テーブルが既にあるかどうかを確認);

■例

    db.createTable("test",[
        "name",
        "age",
        "option"
    ],true);

#### データの追加 ####

    db.insert("テーブル名",インサートするデータオブジェクト,コールバック関数,エラー時のコールバック関数);

■例

    db.insert("test",{
        name: "太郎",
        age: 27,
        option: "特になし"
    });

#### データの更新 ####

    db.update("テーブル名",更新するデータオブジェクト,”SQL に”追加するオプション記述,コールバック関数,エラー時のコールバック関数);

■例

    db.update("test",{
        age: 28
    },"WHERE name='太郎'");

#### データの削除 ####

    db.delete("テーブル名","SQLに追加するオプション記述",コールバック関数,エラー時のコールバック関数);

■例

    db.delete("test","WHERE name='太郎'");

#### データの取得 ####

    db.select("テーブル名","SQLに追加するオプション記述",コールバック関数,エラー時のコールバック関数);

■例

    db.select("test","WHERE name='太郎'",function(result) {
        window.console.log(result);
    });

#### テーブルの削除 ####

    db.dropTable("テーブル名");

■例

    db.dropTable("test");

### 上級者向け ###

#### トランザクション ####

    db.transaction(callback,errorCallback,voidCallback);

任意にトランザクションをする場合に使用します。
使い方はSQLDatabaseAPIのtransactionと同じです。

#### SQLの実行 ####

    db.executeSql(sql,callback,errorCallback);

直でSQL文を実行することができます。
SQL文がselect文の場合にはcallback関数でresultを取得できます。

  db.executeSql("SELECT * FROM test WHERE name='太郎'",function(result) {
        window.console.log(result);
    });

####データベースのバージョン変更 ####

データベースのバージョンを変更することができます。
使い方はほぼSQLDatabaseAPIのchangeVersionと同じです。

  db.changeVersion(newVersion,callback,errorCallback,voidCallback);

### メソッドチェーン ###

本ライブラリではメソッドチェーンで処理をつなぐことができます。（β版）
下記の例ではテーブルを作成後、select文を実行し、結果が返ったとき(then)に処理を実行します。

■例

    db.createTable("test",[
        "name",
        "age",
        "option"
    ],true).select("test").then(function(result) {
        for (var i = 0; i < result.rows.length;i++) {
            var item = result.rows.item(i);
            createRow(item.name,item.age,item.option);
        }
    });

transactionやexecuteSQLもつなぐことができます。

ライセンス
--------
[MIT]: http://www.opensource.org/licenses/mit-license.php
Copyright &copy; 2012 creatorish.com
Distributed under the [MIT License][mit].

作者
--------
creatorish yuu
Weblog: <http://creatorish.com>
Facebook: <http://facebook.com/creatorish>
Twitter: <http://twitter.jp/creatorish>