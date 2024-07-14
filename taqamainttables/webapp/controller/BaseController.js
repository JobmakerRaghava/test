sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox"
], function (
    Controller,
    JSONModel,
    MessageBox
) {
    "use strict";

    return Controller.extend("taqamainttables.controller.BaseController", {
        openDialog: function (name, path) {
            var sname = name;
            this.mDialogs = this.mDialogs || {};
            var oDialog = this.mDialogs[sname];
            if (!oDialog) {
                oDialog = this.loadFragment({
                    name: path,
                    type: "XML",
                    controller: this

                });
                this.mDialogs[sname] = oDialog;
            }
            oDialog.then(function (pDialog) {
                pDialog.open();
            });
        },
        declareModel: function (modelName) {
            this.getView().setModel(new JSONModel({}), modelName);

        },


        CRDoData: function (oModel, sPath, oPayload) {
            return new Promise(function (resolve, reject) {
                oModel.create(sPath, oPayload, {

                    success: function (odata) {
                        resolve(odata);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                })
            })
        },
        UpdateOData: function (oModel, sPath, oPayload) {
            return new Promise(function (resolve, reject) {
                oModel.update(sPath, oPayload, {
                    success: function (odata) {
                        resolve(odata);
                    },
                    error: function (oError) {
                        reject(oError);
                    }
                })
            })
        },
        DeleteOData: function (oModel, sPath) {
            return new Promise(function (resolve, reject) {
                oModel.remove(sPath, {
                    success: function (odata) {
                        resolve(odata);

                    },
                    error: function (oError) {
                        reject(oError);

                    }
                })
            })
        },

        removeEmptyProperties: function (obj) {
            Object.keys(obj).forEach(key => {
                if (obj[key] && typeof obj[key] === 'object') {
                    removeEmptyProperties(obj[key]);
                } else if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
                    delete obj[key];
                }
            });
            return obj;
        },




    });
});