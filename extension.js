const vscode = require('vscode');
const avro = require('avsc');


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// generate HTML for displaying schema
	function getHtmlSchema(schema) {
		let formattedSchema = JSON.stringify(schema, null, 4)
			.replace(/\r|\n/g, '<br/>').replace(/ /g, '&nbsp;');
		return `
			<!DOCTYPE html>
			<html lang=en>
				<body>
					<p>${formattedSchema}</p>
				</body>
			</html>
		`
	}

	// generate HTML for displaying records
	function getHtmlRecords(matrix) {
		let formattedRows = [];
		for (let i = 0; i < matrix.length; i++) {
			let row = matrix[i];
			let formattedCells = [];
			for (let j = 0; j < row.length; j++) {
				let formattedCell = `<td style="padding: 10px;border-bottom: solid 1px;">${row[j]}</td>`
				formattedCells.push(formattedCell);
			}
			let formattedRow = `<tr>${formattedCells.join('')}</tr>`;
			formattedRows.push(formattedRow);
		}
		return `
			<!DOCTYPE html>
			<html lang=en>
				<body>
					<table style="border-top: solid 1px;border-spacing: 0;">
						${formattedRows.join('')}
					</table>
				</body>
			</html>
		`
	}

	let disposable = vscode.commands.registerCommand('avro-viewer.open', function () {
		const avro_path = vscode.window.activeTextEditor.document.fileName;
		const decoder = avro.createFileDecoder(avro_path);

		let schema = {};
		decoder.on('metadata', (metadata) => {
			schema = metadata;
		}).on('end', () => {
			let panel = vscode.window.createWebviewPanel('Schema', 'Avro Schema', vscode.ViewColumn.One, {});
			panel.webview.html = getHtmlSchema(schema);
		});

		let records = [];
		decoder.on('data', (data) => {
			records.push(data);
		}).on('end', () => {
			let header = [];
			for (let i = 0; i < schema['fields'].length; i++) {
				header.push(schema['fields'][i]['name']);
			}
			// create data matrix
			let matrix = [header];
			for (let i = 0; i < records.length; i++) {
				let record = records[i];
				let recordValues = [];
				for (let field of header) {
					let recordValue = (record[field] !== undefined && record[field] !== null) ? record[field] : '';
					recordValues.push(recordValue);
				}
				matrix.push(recordValues);
			}
			let panel = vscode.window.createWebviewPanel('Records', 'Avro Records', vscode.ViewColumn.One, {});
			panel.webview.html = getHtmlRecords(matrix);
		});

		context.subscriptions.push(disposable);
	})
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
