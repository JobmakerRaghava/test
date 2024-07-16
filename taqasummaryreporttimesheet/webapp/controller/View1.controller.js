sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/json/JSONModel",
    "taqasummaryreporttimesheet/util/xlsx",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    function (Controller, BusyIndicator, JSONModel, xlsx, MessageBox, Filter, FilterOperator) {
        "use strict";
        var aAllowances = [
            {
                "Value": "Job Bonus",
                "Key": ""
            },
            {
                "Value": "Overtime",
                "Key": ""
            },
            {
                "Value": "Critical Bonus",
                "Key": ""
            },
            {
                "Value": "Job Bonus %",
                "Key": ""
            },
            {
                "Value": "Meal Allowance",
                "Key": ""
            },
            {
                "Value": "Travel Bonus",
                "Key": ""
            },
            {
                "Value": "Trip Bonus",
                "Key": ""
            },
            {
                "Value": "Tier1",
                "Key": ""
            },
            {
                "Value": "Tier2",
                "Key": ""
            },
            {
                "Value": "Tier3",
                "Key": ""
            },
            {
                "Value": "ZERO NPT Bonus",
                "Key": ""
            },
            {
                "Value": "FTA Bonus",
                "Key": ""
            }
        ];

        return Controller.extend("taqasummaryreporttimesheet.controller.View1", {
            onInit: function () {
                // BusyIndicator.show()
                let oModel = this.getOwnerComponent().getModel(),
                    sPath = "/RowInfo",
                    filters = new Array(),
                    filterByName,
                    filterByStartDate,
                    filterByEndDate,
                    that = this;
                filterByName = new Filter("TableName", FilterOperator.EQ, "CutOffCycles");
                filterByStartDate = new Filter("Column1", FilterOperator.LE, this._convert_Date(new Date()));
                filterByEndDate = new Filter("Column2", FilterOperator.GE, this._convert_Date(new Date()));

                filters.push(filterByName);
                filters.push(filterByStartDate);
                filters.push(filterByEndDate);

                oModel.read(sPath, {
                    filters: filters,
                    success: function (odata) {
                        that.getView().byId("StartDate").setValue(odata.results[0].Column1);
                        that.getView().byId("EndDate").setValue(odata.results[0].Column2);

                        that._onSummaryPress();
                        // BusyIndicator.hide()

                    },
                    error: function (error) {
                        MessageBox.error(error);
                    }
                });


            },
            handleSelectionChange: function (oEvent) {
                //var selectedItems = oEvent.getSource().getSelectedKeys()
                let Filters = oEvent.getSource().getSelectedKeys();
                let oFilterdata = this.getView().getModel("oFilterModel").getData().rows;
                let oFiltered = [];
                //var oFilter= [];
                let tab = this.getView().byId("SummaryTable");
                if (Filters.length == 0) {
                    tab.getModel().getData().rows = oFilterdata;
                } else {
                    oFilterdata.map(function (items, index) {
                        let oValues = Object.values(items);
                        const intersection = oValues.filter(element => Filters.includes(element));
                        if (intersection.length == 1) {
                            oFiltered.push(items);
                        }
                    });
                    tab.getModel().getData().rows = oFiltered;
                }
                tab.getModel().refresh(true);
            },
            _convert_Date: function (value) {
                let date = new Date(value);

                // Get the year, month, and day
                let year = date.getFullYear();
                let month = ("0" + (date.getMonth() + 1)).slice(-2);
                let day = ("0" + date.getDate()).slice(-2);

                // Form the ISO date format string
                let isoDateString = year + "-" + month + "-" + day;
                return isoDateString;
            },

            _onSummaryPress: function () {

                BusyIndicator.show();
                let oHeaderModel = new JSONModel();
                let oAllowancesModel = new JSONModel();
                oAllowancesModel.setData(aAllowances);
                this.getView().setModel(oAllowancesModel, "oAllowancesModel");
                let oSummaryModel = new JSONModel();

                let StartDate_time = this.getView().byId("StartDate").getProperty("value");
                let EndDate_time = this.getView().byId("EndDate").getProperty("value");
                // var StartDate_time = this.getView().byId("StartDate").getValue();
                // var EndDate_time = this.getView().byId("EndDate").getValue();
                let StartDateObject = new Date(StartDate_time);
                let EndDateObject = new Date(EndDate_time);



                let oStart = this._convert_Date(StartDateObject);
                let oEnd = this._convert_Date(EndDateObject);



                var that = this;
                var oFilters = [];
                var oModelDetail = this.getOwnerComponent().getModel();

                oFilters.push(new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.BT, oStart, oEnd));
                oModelDetail.read("/TimeSheetDetails", {
                    filters: [oFilters],
                    urlParameters: {
                        "$expand": "ItsAllowances"
                    },
                    success: function (oData, oResponse) {
                        BusyIndicator.hide();
                        if (oData.results.length == 0) {
                            MessageBox.information("We couldn't find data for the given dates");
                        } else {
                            oSummaryModel.setData(oData);
                            that.getView().setModel(oSummaryModel, "oHeaderModel");
                            that._onSummaryReport();
                            that._onDetailedReport(oData, oHeaderModel);
                        }

                    },
                    error: function (oError) {
                        MessageBox.error(oError);
                    },
                    async: false
                });
            },

            _onSummaryReport: function () {
                let that = this;
                let AdminStatusList = this.getView().getModel("oHeaderModel").getData();
                let rowData = [];

                AdminStatusList.results.map(function (oColumns) {
                    let StartDate_time = that.getView().byId("StartDate").getProperty("value");
                    let EndDate_time = that.getView().byId("EndDate").getProperty("value");
                    let StartDateObject = new Date(StartDate_time);
                    let EndDateObject = new Date(EndDate_time).getTime();
                    if (oColumns.Date != "") {
                        const foundEmpId = rowData.some(e1 => (e1.EmployeeID == oColumns.EmployeeID));
                        //if(!foundEmpId) rowData.push(objj);
                        let oInnerAllowances = oColumns.ItsAllowances.results;
                        if (oInnerAllowances != "") {
                            oInnerAllowances.map(function (itAllowances) {
                                let objj = {
                                    // "Index": index,
                                    "EmployeeID": oColumns.EmployeeID,
                                    "EmployeeName": oColumns.EmployeeName,
                                    "Department": oColumns.Department,
                                    "Division": oColumns.Division,
                                    "Location": oColumns.Location,
                                    "WbsCode": oColumns.WbsCode,
                                    "JobTitle": oColumns.JobTitle
                                };

                                for (let d = StartDateObject; d <= EndDateObject; d.setDate(d.getDate() + 1)) {
                                    // var oDatee = d.toLocaleDateString().split("/").reverse().join("-");
                                    let oDatee = that._convert_Date(d);
                                    objj[oDatee] = "";
                                }
                                if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Overtime") {
                                    let odate = itAllowances.Date;
                                    objj[odate] = itAllowances.AllowanceDesc
                                }
                                if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Job Bonus") {
                                    let odate = itAllowances.Date;
                                    objj[odate] = itAllowances.AllowanceDesc
                                }
                                if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Trip Bonus") {
                                    let odate = itAllowances.Date;
                                    objj[odate] = itAllowances.AllowanceDesc
                                }
                                if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "ZERO NPT Bonus") {
                                    let odate = itAllowances.Date;
                                    objj[odate] = itAllowances.AllowanceDesc
                                }
                                if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Critical Bonus") {
                                    let odate = itAllowances.Date;
                                    objj[odate] = itAllowances.AllowanceDesc
                                }
                                if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Job Bonus %") {
                                    let odate = itAllowances.Date;
                                    objj[odate] = itAllowances.AllowanceDesc
                                }
                                if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Meal Allowance") {
                                    let odate = itAllowances.Date;
                                    objj[odate] = itAllowances.AllowanceDesc
                                }
                                rowData.push(objj);
                            });
                        }
                    }
                });
                rowData.sort(function (a, b) {
                    return parseFloat(a.EmployeeID) - parseFloat(b.EmployeeID);
                });
                let columnData = [
                    {
                        columnName: "EmployeeID"
                    },
                    {
                        columnName: "EmployeeName"
                    },
                    {
                        columnName: "JobTitle"
                    },
                    {
                        columnName: "Department"
                    },
                    {
                        columnName: "Division"
                    },
                    {
                        columnName: "Location"
                    },
                    {
                        columnName: "WbsCode"
                    }
                ];
                let StartDate_time = this.getView().byId("StartDate").getProperty("value");
                let EndDate_time = this.getView().byId("EndDate").getProperty("value");
                let StartDateObject = new Date(StartDate_time);
                let EndDateObject = new Date(EndDate_time).getTime();
                // var StartDate = this.getView().byId("StartDate").getProperty("dateValue");
                // var EndDate = this.getView().byId("EndDate").getProperty("dateValue");
                // var start = StartDateObject;
                // var endTime = EndDateObject.toString();
                // endTime = endTime.getTime();
                for (let start_Date = StartDateObject; start_Date <= EndDateObject; start_Date.setDate(start_Date.getDate() + 1)) {
                    //columnData.columnName = omonthStart;
                    let oMonth = {
                        // "columnName": start_Date.toISOString().substring(0, 10)
                        // "columnName": start_Date.toLocaleDateString().split("/").reverse().join("-")
                        "columnName": that._convert_Date(start_Date)
                    }
                    columnData.push(oMonth);
                }
                let oModelTable = new sap.ui.model.json.JSONModel();
                oModelTable.setData({
                    columns: columnData,
                    rows: rowData,
                });
                let oFilterModel = new JSONModel();
                oFilterModel.setData({
                    columns: columnData,
                    rows: rowData,
                });
                this.getView().setModel(oFilterModel, "oFilterModel");
                let oTable = this.getView().byId("SummaryTable");
                oTable.setModel(oModelTable);
                this.getView().setModel(oModelTable, "oSummaryModel");
                oTable.bindColumns("/columns", function (sId, oContext) {
                    //var sColumnId = oContext.getObject().columnName;
                    let columnName = oContext.getObject().columnName;
                    return new sap.ui.table.Column({
                        label: columnName,
                        width: "7em",
                        template: columnName,
                        sortProperty: columnName
                    });
                });
                oTable.bindRows("/rows");

            },
            _onDetailedReport: function (oData, oHeaderModel) {
                let oResults = oData.results;
                let OHeaderResults = [];
                oResults.map(function (item) {
                    let oHeader = {
                        "EmployeeID": "",
                        "EmployeeName": "",
                        "Date": "",
                        "WbsCode": "",
                        "WorkType": "",
                        "TotalHours": "",
                        "OvertimeHours": "",
                        "JobBonus": "",
                        "CriticalBonus": "",
                        "JobBonusPer": "",
                        "MealAllowance": "",
                        "TravelBonus": "",
                        "TripBonus": "",
                        "Tier1Bonus": "",
                        "Tier2Bonus": "",
                        "Tier3Bonus": "",
                        "ZERONPTBonus": "",
                        "FTABonus": ""
                    };
                    oHeader.EmployeeID = item.EmployeeID;
                    oHeader.EmployeeName = item.EmployeeName;
                    oHeader.Date = item.Date;
                    oHeader.WbsCode = item.WbsCode;
                    oHeader.WorkType = item.WorkType;
                    oHeader.TotalHours = item.TotalHours;
                    oHeader.OvertimeHours = item.OvertimeHours;
                    let oInnerAllowances = item.ItsAllowances.results;
                    oInnerAllowances.map(function (itAllowances) {
                        if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Job Bonus") {
                            oHeader['JobBonus'] = itAllowances.Amount
                        }
                        if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Trip Bonus") {
                            oHeader['TripBonus'] = itAllowances.Amount
                        }
                        if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "ZERO NPT Bonus") {
                            oHeader['ZERONPTBonus'] = itAllowances.Amount
                        }
                        if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Critical Bonus") {
                            oHeader['CriticalBonus'] = itAllowances.Amount
                        }
                        if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Meal Allowance") {
                            oHeader['MealAllowance'] = itAllowances.Amount
                        }
                        if (itAllowances.Amount != undefined && itAllowances.AllowanceDesc == "Job Bonus %") {
                            oHeader['JobBonusPer'] = itAllowances.Amount
                        }
                    });
                    OHeaderResults.push(oHeader);
                });
                OHeaderResults.sort(function (a, b) {
                    return parseFloat(a.EmployeeID) - parseFloat(b.EmployeeID);
                });
                oHeaderModel.setData(OHeaderResults);
                this.getView().setModel(oHeaderModel, "AdminStatusList");
            },
            onGetData: function () {
                var StartDate = this.getView().byId("StartDate").getProperty("dateValue");
                var EndDate = this.getView().byId("EndDate").getProperty("dateValue");


                const obj = StartDate;

                //let obj = new Date(); 
                let day = obj.getDate();
                let month = obj.getMonth() + 1;
                let year = obj.getFullYear();
                console.log(`Day: ${day}, Month: ${month}, Year: ${year}`);

                const newDate = year + "/" + month + "/" + day;
                alert(newDate);
            },
            onExportPress: function () {

                const binding = this.byId("table").getBinding("rows");
                let MyDataModel = this.getView().getModel("oSummaryModel");
                //var myResultArray = MyDataModel.getProperty("/results");
                let oColumns = MyDataModel.getData().rows;
                let oSummaryResults = [];
                for (let iSummary = 0; iSummary <= oColumns.length - 1; iSummary++) {
                    let oColumname = oColumns[iSummary].columnName;
                    let oSummaryColumn = {};
                    oSummaryColumn[oColumname] = "";
                    //oSummaryColumn[iSummary].columnName = ""
                    oSummaryResults.push(oSummaryColumn);
                }
                let worksheet = XLSX.utils.json_to_sheet(oColumns);

                let oResults = [];
                let MyDataModel1 = this.getView().byId("table").getBinding("rows").getModel("AdminStatusList").getProperty(binding.getPath());
                for (let i = 0; i <= MyDataModel1.length - 1; i++) {
                    let object1 = {
                        "Employee ID": MyDataModel1[i].EmployeeID,
                        "Employee Name": MyDataModel1[i].EmployeeName,
                        "Date": MyDataModel1[i].Date,
                        "WBS/CC": MyDataModel1[i].WbsCode,
                        "Working Type": MyDataModel1[i].WorkType,
                        "Total Hours": MyDataModel1[i].TotalHours,
                        "Overtime": MyDataModel1[i].OvertimeHours,
                        "Job Bonus": MyDataModel1[i].JobBonus,
                        "Critical Bonus": MyDataModel1[i].CriticalBonus,
                        "Job Bonus %": MyDataModel1[i].JobBonusPer,
                        "Meal Allowance": MyDataModel1[i].MealAllowance,
                        "Travel Bonus": MyDataModel1[i].TravelBonus,
                        "Trip Bonus": MyDataModel1[i].TripBonus,
                        "Tier1": MyDataModel1[i].Tier1Bonus,
                        "Tier2": MyDataModel1[i].Tier2Bonus,
                        "Tier3": MyDataModel1[i].Tier3Bonus,
                        "ZERO NPT Bonus": MyDataModel1[i].ZERONPTBonus,
                        "FTA Bonus": MyDataModel1[i].FTABonus,
                        "Leave Accrual": ""
                    };
                    oResults.push(object1);
                }

                let worksheet1 = XLSX.utils.json_to_sheet(oResults);

                let workBook = XLSX.utils.book_new();
                // var workBook1 = XLSX.utils.book_new();

                XLSX.utils.book_append_sheet(workBook, worksheet, "Summary Report");
                XLSX.utils.book_append_sheet(workBook, worksheet1, "Detailed Report");
                let sFilename = "Timesheet Report.xlsx";
                XLSX.writeFile(workBook, sFilename);
            }
        });
    });
