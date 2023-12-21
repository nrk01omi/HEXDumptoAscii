const express = require('express');
const multer = require('multer');
const open = require('open');
const fs = require('fs');
const app = express();
const port = 3000;

// ファイルアップロードの設定
const upload = multer({ dest: 'uploads/' });

app.use(express.urlencoded({ extended: true }));

// フォーム生成関数
function generateForm(hexValue = '', asciiOutput = '') {
    // ASCII出力をHTMLエンティティに変換
    const escapedAsciiOutput = asciiOutput
    .replace(/&/g, '&amp;')  // アンパサンド
    .replace(/</g, '&lt;')   // 小なり記号
    .replace(/>/g, '&gt;')   // 大なり記号
    .replace(/"/g, '&quot;') // ダブルクォート
    .replace(/'/g, '&#39;'); // シングルクォート (あるいは &apos;)

    return `
        <form action="/convert" method="post">
            <label for="hexInput">ヘキサデシマル入力:</label><br>
            <input type="text" id="hexInput" name="hexInput" value="${hexValue}" size="50"><br>
            <input type="submit" value="変換">
        </form>
        <form action="/upload" method="post" enctype="multipart/form-data">
            <input type="file" name="file">
            <input type="submit" value="ファイルをアップロードして変換">
        </form>
                
        ${asciiOutput ? `<div>変換結果(生出力): <pre>${asciiOutput}</pre></div>` : ''}
        ${asciiOutput ? `<div>変換結果(エスケープ変換有): <pre>${escapedAsciiOutput}</pre></div>` : ''}
    `;
}

// ファイルアップロード用のフォーム
app.get('/', (req, res) => {
    res.send(`
        ${generateForm()}
    `);
});

// POSTリクエストの処理
app.post('/convert', (req, res) => {
    const hexInput = req.body.hexInput;
    try {
        const asciiOutput = Buffer.from(hexInput, 'hex').toString('ascii');
        res.send(generateForm(hexInput, asciiOutput));
    } catch (error) {
        res.send(generateForm(hexInput, "エラー: 不正なヘキサデシマル文字列"));
    }
});

// ファイルアップロードの処理
app.post('/upload', upload.single('file'), (req, res) => {
    const file = req.file;
    if (!file) {
        return res.send('ファイルがアップロードされていません。');
    }

    const filePath = file.path;
    const fileContent = fs.readFileSync(filePath);  //ascii to value

    //    const hexOutput = fileContent.toString('hex');
    //    const asciiOutput = fileContent.toString('ascii');
    let hexString = '';
    for (let i = 0; i < fileContent.length; i += 2) {
        const char1 = String.fromCharCode(fileContent[i]);
        const char2 = String.fromCharCode(fileContent[i + 1]);
        hexString += char1 + char2;
    }
    asciiOutput = Buffer.from(hexString, 'hex').toString('ascii');

    res.send(generateForm(fileContent, asciiOutput));
});


app.listen(port, () => {
    console.log(`サーバーがポート${port}で起動しました。`);
    open(`http://localhost:${port}`);
});
