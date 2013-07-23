var silex = silex || {}; 
silex.controller = silex.controller || {}; 

goog.provide('silex.Controller');

/**
 * the Silex controller class
 * @constructor
 */
silex.Controller = function(workspace, menu, stage, pageTool, propertiesTool, textEditor, fileExplorer){
	var that = this;
	
	// store references to the view components
	this.workspace = workspace;
	this.menu = menu;
	this.stage = stage;
	this.pageTool = pageTool;
	this.propertiesTool = propertiesTool;
	this.textEditor = textEditor;
	this.fileExplorer = fileExplorer;
	
	// cerate the model
	this.file = new silex.model.File();
	this.selection = new silex.model.Selection();

	// attach events to the view and model
	this.menu.onMenuEvent = function(e){that.menuEvent(e);};
	this.pageTool.onPageToolEvent = function(e){that.pageToolEvent(e);};
	this.propertiesTool.onPropertiesToolEvent = function(e){that.propertiesToolEvent(e);};
	this.propertiesTool.onSelectImage = function(cbk){that.onChooseFileRequest(cbk);};
	this.textEditor.onTextEditorEvent = function(e){that.textEditorEvent(e);};
	//this.fileExplorer.onFileExplorerEvent = function(e){that.fileExplorerEvent(e);};
	this.stage.onStageEvent = function(e){that.stageEvent(e);};
	this.selection.onChanged = function (eventName){that.selectionEvent(eventName)};
}
/**
 * creation template URL constant
 */
silex.Controller.CREATION_TEMPLATE = 'html/creation-template.html';
/**
 * reference to the workspace component (view)
 */
silex.Controller.prototype.workspace;
/**
 * reference to the menu from the view
 * this.menu.menu is the actual closure component 
 */
silex.Controller.prototype.menu;
/**
 * reference to the stage component (view)
 */
silex.Controller.prototype.stage;
/**
 * reference to the page tool component (view)
 */
silex.Controller.prototype.pageTool;
/**
 * reference to the properties tool component (view)
 */
silex.Controller.prototype.propertiesTool;
/**
 * reference to the TextEditor component (view)
 */
silex.Controller.prototype.textEditor;
/**
 * reference to the FileExplorer component (view)
 */
silex.Controller.prototype.fileExplorer;
/**
 * reference to the model
 */
silex.Controller.prototype.file;
/**
 * reference to the model
 */
silex.Controller.prototype.selection;
/**
 * select the element being edited
 */
silex.Controller.prototype.getElement = function(){
	var element;
	var selectedElements = this.selection.getSelectedElements();
	if (selectedElements && selectedElements.length>0){
		element = selectedElements[0];
	}
	else{
		// site background
		element = this.stage.bodyElement;
	}
	return element;
}
/**
 * selection event handler
 */
silex.Controller.prototype.selectionEvent = function(eventName){
	switch (eventName){
		case 'file':
			if (this.selection.getSelectedFile()==null){
				if (this.file.bodyTag==""){
					this.fileClosed();
				}
				else{
					// case of the new site
					this.fileLoaded();
				}
			}
			else{
				this.fileLoaded();
			}
			break;
		case 'page':
			var page = this.selection.getSelectedPage();
			if (page){
				this.stage.openPage(this.selection.getSelectedPage());
			}
			break;
		case 'elements':
			this.propertiesTool.setElements(this.selection.getSelectedElements());
			break;
	}
}
/**
 * TextEditor event handler
 */
silex.Controller.prototype.textEditorEvent = function(e){
	switch(e.type){
		case 'changed':
			var element = this.getElement();
			element.innerHTML = this.textEditor.getData();
			break;
		case 'closed':
			var element = this.getElement();
			this.stage.makeEditable(true, element);
			break;
	}
}
/**
 * FileExplorer event handler
 *
silex.Controller.prototype.fileExplorerEvent = function(e){
	switch(e.type){
		case 'ready':
			break;
	}
}
/**
 * page tool event handler
 */
silex.Controller.prototype.pageToolEvent = function(e){
	switch(e.type){
		case 'selectionChanged':
			this.selection.setSelectedPage(this.pageTool.getSelectedItems()[0]);
			break;
		case 'removePage':
			this.removePage(e.name);
			break;
		case 'ready':
			this.workspace.redraw();
			break;
	}
}
/**
 * properties tool event handler
 */
silex.Controller.prototype.onChooseFileRequest = function(cbk){
	//var url = window.prompt('What is the file name? (todo: open dropbox file browser)', window.location.href+'assets/test.png');
	this.fileExplorer.browse(function (result) {
		if(result && result.url){
			cbk(result.url);
		}
	});
}
/**
 * properties tool event handler
 */
silex.Controller.prototype.propertiesToolEvent = function(e){
	switch(e.type){
		case 'ready':
			this.workspace.redraw();
			break;
		case 'openTextEditor':
			this.editText();
			break;
		case 'changedState':
			break;
		case 'styleChanged':
			var element = this.getElement();
			goog.style.setStyle(element, e.style);
			this.saveSelectionStyle();
			break;
	}
}
/**
 * store style in data-style-*
 */
silex.Controller.prototype.saveSelectionStyle = function(){
	var element = this.getElement();
	var state = this.propertiesTool.state;
	element.setAttribute('data-style-'+state, element.getAttribute('style'));
}
/**
 * properties tool event handler
 */
silex.Controller.prototype.stageEvent = function(e){
	switch(e.type){
		case 'ready':
			this.workspace.redraw();
			break;
		case 'select':
			if (e.element){
				this.selection.setSelectedElements([e.element]);
			}
			else{
				this.selection.setSelectedElements([]);
			}
			break;
		case 'change':
			// size or position of the element has changed
			this.saveSelectionStyle();
			break;
	}
}
/**
 * menu events
 */
silex.Controller.prototype.menuEvent = function(e){
	var that = this;
	if (e && e.target){
		if (goog.dom.classes.has(e.target,'website-name')){
			var name = window.prompt('What is the name of your website?', this.menu.getWebsiteName());
			if(name){
				this.menu.setWebsiteName(name);
				// update website title
				this.stage.setTitle(name);
			}
		}
		else{
			switch(e.target.getId()){
				case 'file.new':
					this.openFile(silex.Controller.CREATION_TEMPLATE, function(){
						that.selection.setSelectedFile(null);
					});
					break;
				case 'file.save':
					if (this.selection.getSelectedFile()==null){
						//var url = window.prompt('What is the file name? (todo: open dropbox file browser)', 
						//	window.location.href+'html/test1.html');

						this.fileExplorer.saveHtmlAs(
						this.file,
						function (resultAfterChooseFile) {
							that.file.save(that.stage.getBody(that.file.url), 
								that.stage.getHead(), that.stage.getBodyStyle());
						},
						function (result) {
							console.log('save success');
							that.selection.setSelectedFile(result.url, false);
						});
					}
					else{
						this.file.save(this.stage.getBody(this.selection.getSelectedFile()), 
							this.stage.getHead(), this.stage.getBodyStyle());
						this.fileExplorer.saveHtml(this.file);
					}
					break;
				case 'file.open':
					this.fileExplorer.browseHtml(this.file, function (result) {
						//var url = window.prompt('What is the file name? (todo: open dropbox file browser)', 
						//window.location.href+'html/test1.html');
						var url = result.url;
						if(url){
							that.openFile(url, function(){
								that.selection.setSelectedFile(url);
							});
						}
					});
					break;
				case 'file.close':
					this.closeFile();
					break;
				case 'view.file':
					window.open(this.selection.file);
					break;
				case 'view.open.fileExplorer':
					this.fileExplorer.browseHtml(this.file);
					break;
				case 'insert.page':
					this.insertPage();
					break;
				case 'insert.text':
					var element = this.stage.addElement(silex.view.Stage.ELEMENT_SUBTYPE_TEXT);
					this.selection.setSelectedElements([element]);
					break;
				case 'insert.image':
					this.onChooseFileRequest(function (url) {
						if(url){
							var element = that.stage.addElement(silex.view.Stage.ELEMENT_TYPE_IMAGE, url);
							that.selection.setSelectedElements([element]);
						}
					})
					break;
				case 'insert.container':
					var element = this.stage.addElement(silex.view.Stage.ELEMENT_TYPE_CONTAINER);
					this.selection.setSelectedElements([element]);
					break;
				case 'edit.delete.selection':
					var element = this.selection.getSelectedElements()[0];
					this.stage.removeElement(element);
					break;
				case 'edit.delete.page':
					this.removePage(this.selection.getSelectedPage());
					break;
			}
		}
	}
	else{
		this.workspace.redraw();
	}
}
/**
 * open a file
 */
silex.Controller.prototype.openFile = function(url, cbk){
	var that = this;
	this.file.load(url, function(){
		if (cbk) cbk();
		that.selection.setSelectedPage(null);
		that.selection.setSelectedElements([]);
	});
}
/**
 * close a file
 */
silex.Controller.prototype.closeFile = function(){
	this.file.close();
	this.selection.setSelectedFile(null);
	this.selection.setSelectedPage(null);
	this.selection.setSelectedElements([]);
}
/**
 * insert a new page
 */
silex.Controller.prototype.insertPage = function(){
	// create the new page in the view
	var pageName = window.prompt('What name for your new page?', '');
	this.stage.createPage(pageName);
	// update tools
	var pages = this.stage.getPages();
	this.pageTool.setDataProvider(pages);
	this.propertiesTool.setPages(pages);
	// update model to open this page
	this.selection.setSelectedPage(pageName);
}
/**
 * remove a page
 */
silex.Controller.prototype.removePage = function(pageName){
	var confirm = window.confirm('I am about to delete the page, are you sure about that?');
	if (confirm){
		// delete the page from the view
		this.stage.removePage(pageName);
		// update tools
		var pages = this.stage.getPages();
		this.pageTool.setDataProvider(pages);
		this.propertiesTool.setPages(pages);
		// update model to open this page
		this.selection.setSelectedPage(this.stage.getPages()[0]);
	}
}
/**
 * Edit text content
 */
silex.Controller.prototype.editText = function(){
	var element = this.getElement();
	this.stage.makeEditable(false, element);
	this.textEditor.openEditor(element.innerHTML);
	this.workspace.redraw();
}
/**
 * model event
 */
silex.Controller.prototype.fileLoaded = function(){
	this.stage.setContent(this.file.bodyTag, this.file.headTag, this.file.bodyStyle, this.selection.getSelectedFile());

	var pages = this.stage.getPages();
	this.pageTool.setDataProvider(pages);
	this.propertiesTool.setPages(pages);
	if (pages.length > 0){
		this.stage.openPage(pages[0]);
		this.pageTool.setSelectedIndexes([0]);
	}

	// update website title
	var title = this.stage.getTitle();
	if (title){
		this.menu.setWebsiteName(title);
	}
}
/**
 * model event
 */
silex.Controller.prototype.fileClosed = function(){
	this.stage.cleanup();
}
