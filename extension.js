const vscode = require('vscode');
const avro = require('avsc');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	let disposable = vscode.commands.registerCommand('avro-viewer.open', function () {

		const avro_path = vscode.window.activeTextEditor.document.fileName;
		const decoder = avro.createFileDecoder(avro_path);

		let schema = {};
		decoder.on('metadata', (metadata) => {
			schema = metadata;
		}).on('end', () => {
			// convert spaces and newlines into html special characters
			let htmlSchema = JSON.stringify(schema, null, 4)
				.replace(/\r|\n/g, '<br/>')
				.replace(/ /g, '&nbsp;');

			let panel = vscode.window.createWebviewPanel(
				'Schema', 'Avro Schema', vscode.ViewColumn.One, {}
			);
			panel.webview.html = `<!DOCTYPE html>
			<html lang="en">
			<body><p>${htmlSchema}</p></body>
			</html>`;
		});

		let records = [];
		decoder.on('data', (data) => {
			records.push(JSON.parse(data));
		}).on('end', () => {
			let header = [];
			for (let i = 0; i < schema['fields'].length; i++) {
				header.push(schema['fields'][i]['name']);
			}
			// create data matrix
			let matrix = [header];
			for (let i = 0; i < records.length; i++) {
				let record = records[i];
				let tmp = [];
				for (let field of header) {
					if (record[field] !== undefined) {
						tmp.push(record[field]);
					} else {
						tmp.push(null);
					}
				}
				matrix.push(tmp);
			}

			// create html table
			let htmlRecords = '<table style="border-top: solid 1px;border-spacing: 0;">';
			for (let i = 0; i < matrix.length; i++) {
				htmlRecords += '<tr>';
				let row = matrix[i];
				for (let j = 0; j < row.length; j++) {
					htmlRecords += '<td style="padding: 10px;border-bottom: solid 1px;">' + row[j] + '</td>';
				}
				htmlRecords += '</tr>';
			}
			htmlRecords += '</table>';

			let panel = vscode.window.createWebviewPanel(
				'Records', 'Avro Records', vscode.ViewColumn.One, {}
			);
			panel.webview.html = `<!DOCTYPE html>
			<html lang="en">
			<body><p>${htmlRecords}</p></body>
			</html>`;
		});

		context.subscriptions.push(disposable);
	})
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
