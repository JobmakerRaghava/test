sap.ui.define([
    "./BaseController",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    'sap/ui/export/Spreadsheet',
    "sap/ui/comp/filterbar/FilterGroupItem",
    "sap/ui/core/TooltipBase",
    "taqamainttables/util/xlsx.full.min"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController,
        MessageToast,
        MessageBox,
        Filter,
        FilterOperator,
        Spreadsheet,
        FilterGroupItem,
        TooltipBase



    ) {
        "use strict";
        return BaseController.extend("taqamainttables.controller.View1", {
            onInit: async function () {
                this.declareModel("columnModel");
                this.declareModel("newTable");
                this.declareModel("excelData");
            },
            massupload: async function () {
                this.openDialog("upload", "taqamainttables.fragments.upload");
                // var oColumns = this.getView().byId("dynamicTable").getColumns(),
                //     ColumnsLabels = [];
                // oColumns.forEach(function (column) {
                //     ColumnsLabels.push(column.getHeader().getText());
                // });
                // ColumnsLabels.splice(0,1);
                // this.spreadsheetUpload = await this.getOwnerComponent().createComponent({
                //     usage: "spreadsheetImporter",
                //     async: true,
                //     propagateModel:true,
                //     componentData: {
                //         columns: ColumnsLabels,
                //         standalone: true,
                //         // readAllSheets: true,
                //         spreadsheetFileName: this.getView().byId("idInput").getValue()+".xlsx"  
                //     }
                // });
                // this.spreadsheetUpload.openSpreadsheetUploadDialog();
                // this.spreadsheetUpload.attachUploadButtonPress(function (event) {
                //     // Prevent data from being sent to the backend
                //     event.preventDefault();
                //     // Get payload
                //     const payload = event.getParameter("payload");
                // }, this);
            },
            onInputValueHelpRequest: function (oEvent) {
                this.openDialog("valueHelp", "taqamainttables.fragments.tablesNames");
            },
            onTableSelectChange: function () {
                var sSelectedTableKey = this.getView().byId("idInput").getValue(),
                    //  sSelectedTableKey = this.byId("tableSelect").getSelectedKey(),
                    oDynamicTable = this.getView().byId("dynamicTable"),
                    oColumnModel = this.getView().getModel("columnModel"),
                    aColumns,
                    that = this,
                    filters = new Array(),
                    filterByName;
                this._originalData = [];
                // this.byId("title").setText(this.byId("tableSelect").getSelectedItem().getText());
                // Clear existing columns and items
                oDynamicTable.destroyColumns();
                oDynamicTable.destroyItems();
                var oModel = this.getOwnerComponent().getModel(),
                    sPath = "/ColumnInfo";
                filterByName = new Filter("TableName", FilterOperator.EQ, sSelectedTableKey);
                filters.push(filterByName);
                var oBusyDialog = new sap.m.BusyDialog();
                oBusyDialog.open();
                oModel.read(sPath, {
                    filters: filters,
                    success: function (odata) {
                        var oResultsColumns = odata.results[0];
                        var res = [];
                        for (var i in oResultsColumns) {
                            res.push(oResultsColumns[i]);
                        };
                        res.splice(0, 5);
                        res.splice(1, 1);
                        res.splice(17, 1)
                        that.removeEmptyProperties(res);
                        that.applyFilters(odata.results[0], sSelectedTableKey);
                        res.forEach(function (sColumn) {
                            // if (sColumn.length == 36) {
                            //     oDynamicTable.addColumn(new sap.m.Column({
                            //         header: new sap.m.Label({
                            //             text: "ID"
                            //         }),
                            //         styleClass: "border",
                            //         visible: false
                            //     }));
                            // }
                            // else {
                            oDynamicTable.addColumn(new sap.m.Column({
                                header: new sap.m.Label({
                                    text: sColumn,
                                    tooltip: sColumn
                                }),
                                styleClass: "border"

                            }));
                            // }
                        });
                        oDynamicTable.getColumns()[0].setVisible(false);
                        // hide sr.No column for Approver Table
                        if (sSelectedTableKey === 'Approver Table') {
                            oDynamicTable.getColumns()[1].setVisible(false);
                        };

                        oColumnModel.setData(res);
                        aColumns = res;
                        //fetching row data
                        oModel.read("/RowInfo", {
                            filters: filters,
                            success: (odatarow) => {
                                var vLength = odatarow.results.length;
                                that._originalData = odatarow.results;
                                // that.getView().byId("title").setText(that.getView().byId("tableSelect").getSelectedItem().getText() + "(" + vLength + ")");
                                that.getView().byId("title").setText(that.getView().byId("idInput").getValue() + "(" + vLength + ")");
                                odatarow.results.forEach(function (oRowData) {
                                    var oRow = new sap.m.ColumnListItem();
                                    var oColsName = [];
                                    //converting to array of records
                                    for (var i = 1; i <= aColumns.length; i++) {
                                        if (i === 1) {
                                            oColsName.push("ID")
                                        }
                                        oColsName.push("Column" + i);
                                    };
                                    oColsName.forEach(function (sColumn) {
                                        oRow.addCell(new sap.m.Text({
                                            text: oRowData[sColumn]
                                        }));
                                    });
                                    oDynamicTable.addItem(oRow);
                                });
                                oBusyDialog.close();
                            },
                            error: (oErrorRow) => {
                                MessageBox.error(JSON.parse(oErrorRow.responseText).error.message.value);
                                oBusyDialog.close();
                            }
                        })
                    },
                    error: function (oError) {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        oBusyDialog.close();
                    }
                });
                this.byId("_IDGenButton1").setVisible(true);
                this.byId("_IDGenButton2").setVisible(false);
                this.byId("_IDGenButton3").setVisible(false);
                this.byId("_IDGenButton4").setVisible(false);
                this.byId("_IDGenButton6").setVisible(false);
                this.byId("idSpreadSheetUploadButton").setVisible(true);
                this.byId("idButtonExcel").setVisible(true);
            },
            onAddRowPress: function () {
                var oDynamicTable = this.getView().byId("dynamicTable"),
                    aColumns = this.getView().getModel("columnModel").getData(),
                    oRow = new sap.m.ColumnListItem();
                // Initialize the new row with Input controls for each column
                aColumns.forEach(function (sColumn) {
                    if (sColumn === 'Start date' || sColumn === 'End date') {
                        oRow.addCell(new sap.m.DatePicker());
                    } else {
                        oRow.addCell(new sap.m.Input(
                            {
                                maxLength: 60
                                //     showValueHelp: true,
                                //     valueHelpRequest: [this.onAlerts, this]
                                //     // valueHelpRequest: this.onAlerts.bind(this) //this also works
                            }
                        ));
                    }
                }.bind(this));
                // Add the new row to the table
                oDynamicTable.insertItem(oRow, 0);
                this.byId("_IDGenButton7").setVisible(false);
                this.byId("_IDGenButton4").setVisible(false);
                this.byId("_IDGenButton3").setVisible(true);
                this.byId("_IDGenButton6").setVisible(false);
                this.byId("_IDGenButton2").setVisible(true);
            },
            onSaveReocrd: function name(oEvent) {
                var oDynamicTable = this.getView().byId("dynamicTable"),
                    // oSelectedItem = oDynamicTable.getSelectedItem(),
                    oSelectedItems = oDynamicTable.getSelectedItems(),
                    oModel = this.getOwnerComponent().getModel(),
                    sPath = "/RowInfo",
                    that = this,
                    aBatchOperations = [];
                if (oSelectedItems.length != 0) {
                    oSelectedItems.forEach(function (oSelectedItem) {
                        var aCells = oSelectedItem.getCells(),
                            oPayload = {},
                            i = 0;
                        aCells.forEach(function (oCell) {
                            if (i === 0) {
                                var sColumn = "ID";
                                var sValue = "";
                                oPayload[sColumn] = sValue;
                                i += 1;
                            } else {
                                var sColumn = "Column" + i;
                                var sValue = oCell.getValue();
                                oPayload[sColumn] = sValue.trim();
                                i += 1;
                            }
                        });
                        // oPayload.TableName = that.getView().byId("tableSelect").getSelectedKey();
                        oPayload.TableName = that.getView().byId("idInput").getValue();
                        delete oPayload.ID;
                        aBatchOperations.push(oPayload);
                        // var oBatchOperation = oModel.createBatchOperation("RowInfo", "POST", oPayload);
                        // aBatchOperations.push(oBatchOperation);
                        aCells.forEach(function (oCell) {
                            var sValue = oCell.getValue();
                            var oText = new sap.m.Text({
                                text: sValue
                            });
                            oSelectedItem.removeCell(oCell);
                            oSelectedItem.addCell(oText);
                        });
                    });
                    var oBusyDialog = new sap.m.BusyDialog();
                    oBusyDialog.open();
                    aBatchOperations.forEach(function (oRecord) {
                        oModel.createEntry("/RowInfo", {
                            properties: oRecord,
                            success: function (oData, oResponse) {
                                // Handle success for each record creation
                            },
                            error: function (oError) {
                                MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                                // Handle error for each record creation
                            }
                        });
                    });
                    oModel.submitChanges({
                        success: function (oData, oResponse) {
                            oBusyDialog.close();
                            that.onTableSelectChange();
                            // Handle success for batch submission
                        },
                        error: function (oError) {
                            MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                            // Handle error for batch submission
                        }
                    })
                    // oModel.addBatchChangeOperations(aBatchOperations);
                    // oModel.submitBatch(function (data) {
                    //     MessageBox.show(data.__batchResponses[0].__changeResponses.length
                    //         + " contacts created", MessageBox.Icon.SUCCESS,
                    //         "Batch Save", sap.ui.commons.MessageBox.Action.OK);
                    // }, function (err) {
                    //     alert("Error occurred ");
                    // });
                    // this.CRDoData(oModel, sPath,oPayloadfinal).then((odata) => {
                    //     MessageBox.success("Row is Created Successfully");
                    //     that.onTableSelectChange();
                    //     oBusyDialog.close();
                    // }).catch((oError) => {
                    //     MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                    // });
                } else {
                    sap.m.MessageToast.show("Please select a row to Save");
                }
            },
            onDeleteRowPress: function () {
                var oDynamicTable = this.getView().byId("dynamicTable"),
                    oSelectedItems = oDynamicTable.getSelectedItems(),
                    oModel = this.getOwnerComponent().getModel(),
                    aBatchOperations = [],
                    that = this;
                // oModel.setUseBatch(true);
                var oBusyDialog = new sap.m.BusyDialog({
                    size: "3rem"
                });
                if (oSelectedItems.length != 0) {
                    oSelectedItems.forEach(function (oSelectedItem) {
                        try {
                            if (oSelectedItem.getCells()[0].getValue() === '') {
                                oDynamicTable.removeItem(oSelectedItem);
                            }
                        } catch (error) {
                            var aKey = oSelectedItem.getCells()[0].getText(),
                                sPath = "/RowInfo(guid'" + aKey + "')";
                            oBusyDialog.open();
                            // var oBatchOperation = oModel.createBatchOperation(sPath, "DELETE");
                            // aBatchOperations.push(oBatchOperation);
                            that.DeleteOData(oModel, sPath).then((odata) => {
                                //
                            }).catch((oError) => {
                                oBusyDialog.close();
                                MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                            });
                        }
                    });
                    // oModel.addBatchChangeOperations(aBatchOperations);
                    oModel.submitChanges({
                        success: function (oResponse) {
                            // Handle success
                            oBusyDialog.close();
                            MessageBox.success("Selected Rows are Deleted Successfully");
                            that.onTableSelectChange();
                        },
                        error: function (oError) {
                            // Handle error
                            oBusyDialog.close();
                            MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                    });
                }
                else {
                    sap.m.MessageToast.show("Please select a row to Delete");
                }
                this.byId("_IDGenButton2").setVisible(false);
                this.byId("_IDGenButton3").setVisible(false);
                this.byId("_IDGenButton4").setVisible(false);
            },
            onEditRowPress: function () {
                var oDynamicTable = this.getView().byId("dynamicTable"),
                    oSelectedItems = oDynamicTable.getSelectedItems();
                // oSelectedItem = oDynamicTable.getSelectedItem();
                if (oSelectedItems) {
                    oSelectedItems.forEach(function (oSelectedItem) {
                        var aCells = oSelectedItem.getCells();
                        aCells.forEach(function (oCell) {
                            if (oCell instanceof sap.m.Text) {
                                var sText = oCell.getText();
                                if (sText.includes('/', 3, 6)) {
                                    var oInput = new sap.m.DatePicker({
                                        value: sText
                                    });
                                    oSelectedItem.removeCell(oCell);
                                    oSelectedItem.addCell(oInput);
                                } else {
                                    var oInput = new sap.m.Input({
                                        value: sText,
                                        maxLength: 60
                                    });
                                    oSelectedItem.removeCell(oCell);
                                    oSelectedItem.addCell(oInput);
                                }
                            }
                        });
                    })
                } else {
                    sap.m.MessageToast.show("Please select a row to edit");
                }
                this.byId("_IDGenButton2").setVisible(false);
                this.byId("_IDGenButton4").setVisible(false);
                this.byId("_IDGenButton6").setVisible(true);
                this.byId("_IDGenButton7").setVisible(true);
            },
            onEditCancel: function (oEvent) {
                this.onTableSelectChange();
                // var oDynamicTable = this.getView().byId("dynamicTable");
                // var oSelectedItem = oDynamicTable.getSelectedItem();
                // if (oSelectedItem) {
                //     var aCells = oSelectedItem.getCells();
                //     var oRowData = {};
                //     var aCells = oSelectedItem.getCells();
                //     aCells.forEach(function (oCell) {
                //         // if (oCell instanceof sap.m.Input) {
                //         var sValue = oCell.getValue();
                //         var oText = new sap.m.Text({
                //             text: sValue
                //         });
                //         oSelectedItem.removeCell(oCell);
                //         oSelectedItem.addCell(oText);
                //         // }
                //     });
                // } else {
                //     sap.m.MessageToast.show("Please select a row to save");
                // }
                this.byId("_IDGenButton7").setVisible(false);
                this.byId("_IDGenButton4").setVisible(true);
            },
            onAddTable: function (oEvent) {
                this.openDialog("addTable", "taqamainttables.fragments.addTable")
            },
            onClose: function (oEvent) {
                oEvent.getSource().getParent().close();
                this.getView().getModel("newTable").setData({});
            },
            onCreate: function (oEvent) {
                var oPayload = this.getView().getModel("newTable").getData(),
                    vTablename = this.byId("idTablenameInput").getValue().trim(),
                    vColumn1 = this.byId("idColumnInput").getValue().trim(),
                    oModel = this.getOwnerComponent().getModel(),
                    sPath = "/ColumnInfo";
                if (vTablename === "" || vColumn1 === "") {
                    MessageBox.error("Enter \"Table name\" and \"Column1\"");
                }
                else {
                    var oBusyDialog = new sap.m.BusyDialog({
                        size: "3rem"
                    });
                    oBusyDialog.open();
                    this.CRDoData(oModel, sPath, oPayload).then((odata) => {
                        MessageBox.success("Table is Created Successfully");
                        oBusyDialog.close();
                        this.getView().getModel("newTable").setData({});
                    }).catch((oError) => {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        oBusyDialog.close();
                    });
                };
            },
            onAlerts: function (oEvent) {
                MessageToast.show("ValueHelp Pressed...");
                // var id =oEvent.getSource().getParent().getContent()[1].getValue();
            },
            onTableSelectionChange: function (oEvent) {
                var oSelectedItems = oEvent.getSource().getSelectedItems();
                if (oSelectedItems.length != 0) {
                    this.byId("_IDGenButton3").setVisible(true);
                    this.byId("_IDGenButton4").setVisible(true);
                    this.byId("_IDGenButton2").setVisible(true);
                    this.byId("_IDGenButton6").setVisible(false);
                    this.byId("_IDGenButton7").setVisible(false);
                } else {
                    this.byId("_IDGenButton3").setVisible(false);
                    this.byId("_IDGenButton4").setVisible(false);
                    this.byId("_IDGenButton2").setVisible(false);
                    this.byId("_IDGenButton6").setVisible(false);
                    this.byId("_IDGenButton7").setVisible(false);
                }

            },
            onUpdate: function (oEvent) {
                var oDynamicTable = this.getView().byId("dynamicTable");
                var oSelectedItems = oDynamicTable.getSelectedItems();
                var oModel = this.getOwnerComponent().getModel(),
                    that = this;
                var oBusyDialog = new sap.m.BusyDialog();
                if (oSelectedItems.length != 0) {
                    oSelectedItems.forEach(function (oSelectedItem) {
                        var aCells = oSelectedItem.getCells(),
                            oPayload = {},
                            i = 0;
                        aCells.forEach(function (oCell) {
                            // if (oCell instanceof sap.m.Input) {
                            if (i === 0) {
                                var sColumn = "ID";
                                var sValue = oCell.getValue();
                                oPayload[sColumn] = sValue;
                                i += 1;
                            } else {
                                var sColumn = "Column" + i;
                                var sValue = oCell.getValue();
                                oPayload[sColumn] = sValue.trim();
                                i += 1;
                            }
                            // }
                        });
                        // oPayload.TableName = this.getView().byId("tableSelect").getSelectedKey();
                        delete oPayload.Column17;
                        var sPath = "/RowInfo(guid'" + oPayload.ID + "')";
                        aCells.forEach(function (oCell) {
                            // if (oCell instanceof sap.m.Input) {
                            var sValue = oCell.getValue();
                            var oText = new sap.m.Text({
                                text: sValue
                            });
                            oSelectedItem.removeCell(oCell);
                            oSelectedItem.addCell(oText);
                            // }
                        });
                        oBusyDialog.open();
                        that.UpdateOData(oModel, sPath, oPayload).then((odata) => {
                        }).catch((oError) => {
                            MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        });
                    });
                    oModel.submitChanges({
                        success: function (oResponse) {
                            // Handle success
                            that.onTableSelectChange();
                            MessageBox.success("Selected Rows are Updated Successfully");
                            oBusyDialog.close();
                        },
                        error: function (oError) {
                            // Handle error
                            that.onTableSelectChange();
                            oBusyDialog.close();
                            MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        }
                    });
                } else {
                    sap.m.MessageToast.show("Please select a row to save");
                }
                this.byId("_IDGenButton7").setVisible(false);
            },
            onColumnInfoSelectDialogConfirm: function (oEvent) {
                var aSelectedItem = oEvent.getParameter("selectedItem").getTitle();
                var oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([]);
                this.getView().byId("idInput").setValue(aSelectedItem);
                this.onTableSelectChange();
            },
            onColumnInfoSelectDialogSearch: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oFilter = new Filter("TableName", FilterOperator.Contains, sValue);
                var oBinding = oEvent.getSource().getBinding("items");
                oBinding.filter([oFilter]);
            },
            onCancelButtonPress: function (oEvent) {
                oEvent.getSource().getParent().close();
                this.getView().byId("idFileUploader").clear();
                this.getView().getModel("excelData").setData({});
            },
            onUploadButtonPress: async function (oEvent) {
                var oExcelData = this.getView().getModel("excelData").getData(),
                    oModel = this.getOwnerComponent().getModel(),
                    that = this;
                var oBusyDialog = new sap.m.BusyDialog();
                oBusyDialog.open();
                oExcelData.forEach(function (oRecord, index) {
                    oModel.createEntry("/RowInfo", {
                        //  oModel.create("/RowInfo", oRecord, {
                        properties: oRecord,
                        success: function (oData, oResponse) {
                            // Handle success for each record creation
                        },
                        error: function (oError) {
                            var a = index;
                            MessageToast.show(JSON.parse(oError.responseText).error.message.value);
                            // Handle error for each record creation
                        }
                    });

                });
                // oBusyDialog.close();

                oModel.submitChanges({
                    success: function (oData, oResponse) {
                        oBusyDialog.close();
                        that.onTableSelectChange();
                        oEvent.getSource().getParent().close();
                        that.getView().byId("idFileUploader").clear();
                        that.getView().getModel("excelData").setData({});
                        // Handle success for batch submission
                    },
                    error: function (oError) {
                        MessageBox.error(JSON.parse(oError.responseText).error.message.value);
                        // Handle error for batch submission
                    }
                })
            },
            onFileUploaderChange: function (oEvent) {
                var file = oEvent.getParameter("files") && oEvent.getParameter("files")[0];
                var that = this;
                var excelData = {},
                    excelDataTemp = {},
                    vSheetName = this.getView().byId("idInput").getValue();
                if (file && window.FileReader) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var data = e.target.result;
                        // read data from excel sheet
                        var workbook = XLSX.read(data, {
                            type: 'binary'
                        });

                        excelDataTemp = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[vSheetName]);
                        function processData(data) {
                            return data.map(record => {
                                let processedRecord = {};
                                for (let key in record) {
                                    record[key].trim();//remove spaces from column
                                    if (typeof record[key] === 'number') {
                                        processedRecord[key] = String(record[key]);
                                    } else if (record[key] === undefined || record[key] === null) {
                                        processedRecord[key] = "";
                                    } else {
                                        processedRecord[key] = record[key];
                                    }
                                }
                                return processedRecord;
                            });
                        };
                        excelData = processData(excelDataTemp);
                        debugger;
                        if (excelData.length === 0) {
                            MessageBox.error("SheetName must be same as Table Name");
                            that.getView().getDependents()[1].close();
                            that.getView().byId("idFileUploader").clear();

                        }
                        else {
                            var oExcelData = excelData.map(function (obj) {
                                var oKeys = Object.keys(obj);
                                var oRowData = {
                                    Column1: obj[oKeys[0]],
                                    Column2: obj[oKeys[1]],
                                    Column3: obj[oKeys[2]],
                                    Column4: obj[oKeys[3]],
                                    Column5: obj[oKeys[4]],
                                    Column6: obj[oKeys[5]],
                                    Column7: obj[oKeys[6]],
                                    Column8: obj[oKeys[7]],
                                    Column9: obj[oKeys[8]],
                                    Column10: obj[oKeys[9]],
                                    Column11: obj[oKeys[10]],
                                    Column12: obj[oKeys[11]],
                                    Column13: obj[oKeys[12]],
                                    Column14: obj[oKeys[13]],
                                    Column15: obj[oKeys[14]],
                                    Column16: obj[oKeys[15]],
                                    TableName: that.getView().byId("idInput").getValue()
                                };
                                //remove the no data properties
                                return Object.fromEntries(
                                    Object.entries(oRowData).filter(([key, value]) => value !== undefined)
                                );
                            });
                            // Setting the data to the local model 
                            that.getView().getModel("excelData").setData(oExcelData);
                        }
                        // get the all worksheet names

                        // workbook.SheetNames.forEach(function (sheetName) {
                        // Here is your object for every sheet in workbook
                        // excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                        //excelData contains only last sheet data,
                        //if we want all the sheet data specify sheet name
                        // });
                        //Changing the columns name as entityset level names

                    };
                    reader.onerror = function (ex) {
                        console.log(ex);
                    };
                    reader.readAsBinaryString(file);
                }
            },
            onDownloadTemplateButtonPress: function (oEvent) {
                // var rows = ['id','name'];
                // const worksheet = XLSX.utils.json_to_sheet(rows);
                // const workbook = XLSX.utils.book_new();
                // XLSX.utils.book_append_sheet(workbook, worksheet, "Employee");
                // XLSX.writeFile(workbook, "down_ui.xlsx", { compression: true });
                var oColumns = this.getView().byId("dynamicTable").getColumns(),
                    ColumnsLabels = [];
                oColumns.forEach(function (column) {
                    ColumnsLabels.push({ property: column.getHeader().getText() });
                });
                ColumnsLabels.splice(0, 1);
                var oSettings = {
                    workbook: {
                        columns: ColumnsLabels,
                        hierarchyLevel: 'Level',
                        context: {
                            sheetName: this.getView().byId("idInput").getValue()
                        }
                    },

                    dataSource: [{}],
                    fileName: this.getView().byId("idInput").getValue() + '_Template.xlsx'
                    // worker: false // We need to disable worker because we are using a MockServer as OData Service
                };
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
            },
            onExcelButtonPress: function (oEvent) {
                var oColumns = this.getView().byId("dynamicTable").getColumns(),
                    oRowBinding = this.getView().byId("dynamicTable").getItems(),
                    ColumnsLabels = [],
                    data = [];
                oColumns.forEach(function (column) {
                    ColumnsLabels.push({ property: column.getHeader().getText() });
                });
                ColumnsLabels.splice(0, 1);
                oRowBinding.forEach(function (oItem) {
                    var itemData = {};
                    oColumns.forEach(function (oColumn, index) {
                        var columnId = oColumn.getHeader().getText();
                        var cell = oItem.getCells()[index];
                        itemData[columnId] = cell.getText(); // Adjust this based on your cell content
                    });
                    data.push(itemData);
                });
                var oSettings = {
                    workbook: {
                        columns: ColumnsLabels,
                        // hierarchyLevel: 'Level',
                        context: {
                            sheetName: this.getView().byId("idInput").getValue()
                        }
                    },
                    dataSource: data,
                    fileName: this.getView().byId("idInput").getValue() + '.xlsx',
                    worker: false // We need to disable worker because we are using a MockServer as OData Service
                };
                var oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function () {
                    oSheet.destroy();
                });
            },
            applyFilters: function (oEvent, tablename) {
                var oEvents = oEvent,
                    vTable = tablename;
                var oFilterBar = this.getView().byId("idFilterBar");
                oFilterBar.destroyFilterGroupItems();

                let propsToDelete = ['DELETED', 'ID', 'TableName', 'createdAt', 'createdBy', 'modifiedAt', 'modifiedBy', '__metadata'];
                propsToDelete.forEach(prop => {
                    delete oEvents[prop];
                });
                Object.keys(oEvents).forEach(key => {
                    if (oEvents[key] === '' || oEvents[key] === null || oEvents[key] === undefined) {
                        delete oEvents[key];
                    }
                });
                var oColumnFilters = Object.entries(oEvents);
                if (vTable === "Approver Table") {
                    oColumnFilters.forEach(function (oColumn, index) {
                        oFilterBar.addFilterGroupItem(new FilterGroupItem({
                            groupName: 'Group' + index,
                            name: oColumn[0],
                            label: oColumn[1],
                            control: new sap.m.Input({ name: oColumn[0] }),
                            //Showing default filters
                            visibleInFilterBar: index == 2 || index == 5 ? true : false
                        }));
                    });
                } else {
                    oColumnFilters.forEach(function (oColumn, index) {
                        oFilterBar.addFilterGroupItem(new FilterGroupItem({
                            groupName: 'Group' + index,
                            name: oColumn[0],
                            label: oColumn[1],
                            control: new sap.m.Input({ name: oColumn[0] }),
                            //Showing default filters
                            // visibleInFilterBar: index <= 2 ? true : false
                        }));
                    });
                }



            },
            onFilterBarSearch: function (oEvent) {
                var oFilterBar = this.getView().byId("idFilterBar");
                var oTable = this.getView().byId("dynamicTable");
                var aTableFilters = oFilterBar.getFilterGroupItems().reduce(function (aResult, oFilterGroupItem) {
                    var oControl = oFilterGroupItem.getControl();
                    var aFilters = [];

                    // Check the type of control
                    // if (oControl instanceof sap.m.MultiInput) {
                    //     var aTokens = oControl.getTokens();
                    //     if (aTokens.length > 0) {
                    //         aTokens.forEach(function (oToken) {
                    //             var sTokenValue = oToken.getText();
                    //             if (sTokenValue) {
                    //                 aFilters.push(new Filter({
                    //                     path: oFilterGroupItem.getName(),
                    //                     operator: FilterOperator.EQ,
                    //                     value1: sTokenValue
                    //                 }));
                    //             }
                    //         });
                    //     }
                    // } else
                    if (oControl instanceof sap.m.Input) {
                        var sInputValue = oControl.getValue();
                        if (sInputValue) {
                            aFilters.push(new Filter({
                                path: oFilterGroupItem.getName(),
                                operator: FilterOperator.EQ,
                                value1: sInputValue
                            }));
                        }
                    }

                    if (aFilters.length > 0) {
                        aResult.push(new sap.ui.model.Filter({
                            filters: aFilters,
                            and: true // Combine filters with OR
                        }));
                    }

                    return aResult;
                }, []);


                const filteredData = this._originalData.filter(item => {
                    return aTableFilters.every(filterGroup => {
                        return filterGroup.aFilters.some(filter => {
                            return item[filter.sPath] === filter.oValue1;
                        });
                    });
                });

                // Clear the table and populate it with filtered data
                oTable.destroyItems();
                this.populateTableWithRowData(this.getView().getModel("columnModel").getData(), filteredData, oTable);

                // Apply filters to the table binding
                // oTable.getBinding("items").filter(aTableFilters);
                // oTable.setShowOverlay(false);

            },
            populateTableWithRowData: function (aColumns, rowData, oDynamicTable) {
                const vLength = rowData.length;
                this.getView().byId("title").setText(`${this.getView().byId("idInput").getValue()} (${vLength})`);

                rowData.forEach(oRowData => {
                    const oRow = new sap.m.ColumnListItem(),
                        oColsName = [];
                    //   oColsName = ["ID", ...aColumns.map((_, i) => `Column${i + 2}`)];
                    for (var i = 1; i <= aColumns.length; i++) {
                        if (i === 1) {
                            oColsName.push("ID")
                        }
                        oColsName.push("Column" + i);
                    };

                    oColsName.forEach(sColumn => {
                        oRow.addCell(new sap.m.Text({ text: oRowData[sColumn] }));
                    });

                    oDynamicTable.addItem(oRow);
                });
            },

        });
    });
