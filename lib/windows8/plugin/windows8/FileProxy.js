var cordova = require('cordova'),
    FileError = require('fileError'),
    Flags = require('flags');


module.exports = { //Merges with common

    getFileMetaData:function(win,fail,args) {


        Windows.Storage.StorageFile.getFileFromPathAsync(args[0]).done(
            function (storageFile) {
                storageFile.getBasicPropertiesAsync().then(
                    function (basicProperties) {
                        win(new File(storageFile.name, storageFile.path, storageFile.fileType, basicProperties.dateModified, basicProperties.size));
                    }, function () {
                        fail(FileError.NOT_READABLE_ERR);
                    }
                );
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    getMetadata:function(win,fail,args) {
        // this.fullPath
        // this.isDirectory
        // this.isFile
        if (this.isFile) {
            Windows.Storage.StorageFile.getFilFromPathAsync(args[0]).done(
                function (storageFile) {
                    storageFile.getBasicPropertiesAsync().then(
                        function (basicProperties) {
                            success(basicProperties.dateModified);
                        },
                        function () {
                            fail(FileError.NOT_READABLE_ERR);
                        }
                    );
                },
                function () {
                    fail(FileError.NOT_READABLE_ERR);
                }
            );
        }

        if (this.isDirectory) {
            Windows.Storage.StorageFolder.getFolderFromPathAsync(this.fullPath).done(
                function (storageFolder) {
                    storageFolder.getBasicPropertiesAsync().then(
                        function (basicProperties) {
                            success(basicProperties.dateModified);
                        },
                        function () {
                            fail(FileError.NOT_FOUND_ERR);
                        }
                    );
                },
                function () {
                    fail(FileError.NOT_READABLE_ERR);
                }
            );
        }
    },

    getParent:function(win,fail,args) { // ["fullPath"]
        var fullPath = args[0];



        var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
        var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;

        if (fullPath == FileSystemPersistentRoot) {
            win(new DirectoryEntry(storageFolderPer.name, storageFolderPer.path));
            return;
        } else if (fullPath == FileSystemTemproraryRoot) {
            win(new DirectoryEntry(storageFolderTem.name, storageFolderTem.path));
            return;
        }
        var splitArr = fullPath.split(new RegExp(/\/|\\/g));

        var popItem = splitArr.pop();

        var result = new DirectoryEntry(popItem, fullPath.substr(0, fullPath.length - popItem.length - 1));
        Windows.Storage.StorageFolder.getFolderFromPathAsync(result.fullPath).done(
            function () { win(result); },
            function () { fail(FileError.INVALID_STATE_ERR); }
        );
    },

    readAsText:function(win,fail,args) {
        var enc = args[1];

        Windows.Storage.StorageFile.getFileFromPathAsync(args[0]).done(
            function (storageFile) {
                var value = Windows.Storage.Streams.UnicodeEncoding.utf8;
                if (enc == 'Utf16LE' || enc == 'utf16LE') {
                    value = Windows.Storage.Streams.UnicodeEncoding.utf16LE;
                }else if (enc == 'Utf16BE' || enc == 'utf16BE') {
                    value = Windows.Storage.Streams.UnicodeEncoding.utf16BE;
                }
                Windows.Storage.FileIO.readTextAsync(storageFile, value).done(
                    function (fileContent) {
                        win(fileContent);
                    },
                    function () {
                        fail(FileError.ENCODING_ERR);
                    }
                );
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    readAsDataURL:function(win,fail,args) {


        Windows.Storage.StorageFile.getFileFromPathAsync(args[0]).then(
            function (storageFile) {
                Windows.Storage.FileIO.readBufferAsync(storageFile).done(
                    function (buffer) {
                        var strBase64 = Windows.Security.Cryptography.CryptographicBuffer.encodeToBase64String(buffer);
                        //the method encodeToBase64String will add "77u/" as a prefix, so we should remove it
                        if(String(strBase64).substr(0,4) == "77u/") {
                            strBase64 = strBase64.substr(4);
                        }
                        var mediaType = storageFile.contentType;
                        var result = "data:" + mediaType + ";base64," + strBase64;
                        win(result);
                    }
                );
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    getDirectory:function(win,fail,args) {
        // this.fullPath
        // path
        // options
        var path = args[1];
        var options = args[2];

        var flag = "";
        if (options !== null) {
            flag = new Flags(options.create, options.exclusive);
        } else {
            flag = new Flags(false, false);
        }

        path = String(path).split(" ").join("\ ");

        Windows.Storage.StorageFolder.getFolderFromPathAsync(args[0]).then(
            function (storageFolder) {
                if (flag.create === true && flag.exclusive === true) {
                    storageFolder.createFolderAsync(path, Windows.Storage.CreationCollisionOption.failIfExists).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail(FileError.PATH_EXISTS_ERR);
                        }
                    );
                } else if (flag.create === true && flag.exclusive === false) {
                    storageFolder.createFolderAsync(path, Windows.Storage.CreationCollisionOption.openIfExists).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    );
                } else if (flag.create === false) {
                    if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(path)) {
                        fail(FileError.ENCODING_ERR);
                        return;
                    }

                    storageFolder.getFolderAsync(path).done(
                        function (storageFolder) {
                            win(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail(FileError.NOT_FOUND_ERR);
                        }
                    );
                }
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    remove:function(win,fail,args) {
        var fullPath = args[0];
        // this.isDirectory
        // this.isFile

        if (this.isFile) {
            Windows.Storage.StorageFile.getFileFromPathAsync(fullPath).done(function (storageFile) {
                storageFile.deleteAsync().done(successCallback, function () {
                    fail(FileError.INVALID_MODIFICATION_ERR);

                });
            });
        }
        if (this.isDirectory) {

            var removeEntry = function () {
                var storageFolder = null;

                Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).then(function (storageFolder) {
                    //FileSystem root can't be removed!
                    var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
                    var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;
                    if (fullPath == storageFolderPer.path || fullPath == storageFolderTem.path) {
                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                        return;
                    }
                    storageFolder.createFileQuery().getFilesAsync().then(function (fileList) {

                        if (fileList.length === 0) {
                            storageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {

                                if (folderList.length === 0) {
                                    storageFolder.deleteAsync().done(successCallback, function () {
                                        fail(FileError.INVALID_MODIFICATION_ERR);

                                    });
                                } else {
                                    fail(FileError.INVALID_MODIFICATION_ERR);
                                }
                            });
                        } else {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    });

                }, function () {
                    fail(FileError.INVALID_MODIFICATION_ERR);

                });


            };
            removeEntry();
        }

    },

    removeRecursively:function(win,fail,args) { // ["fullPath"]
        var fullPath = args[0];

        Windows.Storage.StorageFolder.getFolderFromPathAsync(this.fullPath).done(function (storageFolder) {
        var storageFolderPer = Windows.Storage.ApplicationData.current.localFolder;
        var storageFolderTem = Windows.Storage.ApplicationData.current.temporaryFolder;

        if (storageFolder.path == storageFolderPer.path || storageFolder.path == storageFolderTem.path) {
            fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            return;
        }

        var removeFolders = function (path) {
            return new WinJS.Promise(function (complete) {
                Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(function (storageFolder) {
                    var fileListPromise = storageFolder.createFileQuery().getFilesAsync();
                    var filePromiseArr = [];

                    fileListPromise.then(function (fileList) {
                        if (fileList !== null) {
                            for (var i = 0; i < fileList.length; i++) {
                                var filePromise = fileList[i].deleteAsync();
                                filePromiseArr.push(filePromise);
                            }
                        }
                        WinJS.Promise.join(filePromiseArr).then(function () {
                            var folderListPromise = storageFolder.createFolderQuery().getFoldersAsync();
                            folderListPromise.then(function (folderList) {
                                var folderPromiseArr = [];
                                if (folderList.length !== 0) {
                                    for (var j = 0; j < folderList.length; j++) {

                                        folderPromiseArr.push(removeFolders(folderList[j].path));
                                    }
                                    WinJS.Promise.join(folderPromiseArr).then(function () {
                                        storageFolder.deleteAsync().then(complete);
                                    });
                                } else {
                                    storageFolder.deleteAsync().then(complete);
                                }
                            }, function () { });
                       });
                    }, function () { });
                });
            });
        };
        removeFolders(storageFolder.path).then(function () {
            Windows.Storage.StorageFolder.getFolderFromPathAsync(storageFolder.path).then(
                function () {},
                function () {
                    if (typeof successCallback !== 'undefined' && successCallback !== null) { successCallback(); }
                });
            });
        });
    },

    getFile:function(win,fail,args) {
        var fullPath = args[0];
        var path = args[1];
        var options = args[2];

        var flag = "";
        if (options !=- null) {
            flag = new Flags(options.create, options.exclusive);
        } else {
            flag = new Flags(false, false);
        }

        path = String(path).split(" ").join("\ ");

        Windows.Storage.StorageFolder.getFolderFromPathAsync(fullPath).then(
            function (storageFolder) {
                if (flag.create === true && flag.exclusive === true) {
                    storageFolder.createFileAsync(path, Windows.Storage.CreationCollisionOption.failIfExists).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            fail(FileError.PATH_EXISTS_ERR);
                        }
                    );
                } else if (flag.create === true && flag.exclusive === false) {
                    storageFolder.createFileAsync(path, Windows.Storage.CreationCollisionOption.openIfExists).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    );
                } else if (flag.create === false) {
                    if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(path)) {
                        fail(FileError.ENCODING_ERR);
                        return;
                    }
                    storageFolder.getFileAsync(path).done(
                        function (storageFile) {
                            win(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {
                            fail(FileError.NOT_FOUND_ERR);
                        }
                    );
                }
            }, function () {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    readEntries:function(win,fail,args) { // ["fullPath"]


        var result = new Array();
        var path = args[0];
        Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(function (storageFolder) {
            var promiseArr = [];
            var index = 0;
            promiseArr[index++] = storageFolder.createFileQuery().getFilesAsync().then(function (fileList) {
                if (fileList !== null) {
                    for (var i = 0; i < fileList.length; i++) {
                        result.push(new FileEntry(fileList[i].name, fileList[i].path));
                    }
                }
            });
            promiseArr[index++] = storageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {
                if (folderList !== null) {
                    for (var j = 0; j < folderList.length; j++) {
                        result.push(new FileEntry(folderList[j].name, folderList[j].path));
                    }
                }
            });
            WinJS.Promise.join(promiseArr).then(function () {
                win(result);
            });

        }, function () { fail(FileError.NOT_FOUND_ERR); });
    },

    write:function(win,fail,args) {
        var text = args[1];
        // this.position

        Windows.Storage.StorageFile.getFileFromPathAsync(args[0]).done(
            function (storageFile) {
                Windows.Storage.FileIO.writeTextAsync(storageFile,text,Windows.Storage.Streams.UnicodeEncoding.utf8).done(
                    function() {
                        win(String(text).length);
                    }, function () {
                        fail(FileError.INVALID_MODIFICATION_ERR);
                    }
                );
            }, function() {
                fail(FileError.NOT_FOUND_ERR);
            }
        );
    },

    truncate:function(win,fail,args) { // ["fileName","size"]
        var fileName = args[0];
        var size = args[1];

        Windows.Storage.StorageFile.getFileFromPathAsync(fileName).done(function(storageFile){
            //the current length of the file.
            var leng = 0;

            storageFile.getBasicPropertiesAsync().then(function (basicProperties) {
                leng = basicProperties.size;
                if (Number(size) >= leng) {
                    win(this.length);
                    return;
                }
                if (Number(size) >= 0) {
                    Windows.Storage.FileIO.readTextAsync(storageFile, Windows.Storage.Streams.UnicodeEncoding.utf8).then(function (fileContent) {
                        fileContent = fileContent.substr(0, size);
                        var fullPath = storageFile.path;
                        var name = storageFile.name;
                        var entry = new Entry(true, false, name, fullPath);
                        var parentPath = "";
                        do {
                            var successCallBack = function (entry) {
                                parentPath = entry.fullPath;
                            };
                            entry.getParent(successCallBack, null);
                        }
                        while (parentPath === "");
                        storageFile.deleteAsync().then(function () {
                            Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolder) {
                                storageFolder.createFileAsync(name).then(function (newStorageFile) {
                                    Windows.Storage.FileIO.writeTextAsync(newStorageFile, fileContent).done(function () {
                                        win(String(fileContent).length);
                                    }, function () {
                                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                                    });
                                });
                            });
                        });
                    }, function () { fail(FileError.NOT_FOUND_ERR); });
                }
            });
        }, function () { fail(FileError.NOT_FOUND_ERR); });
    },

    copyTo:function(win,fail,args) { // ["fullPath","parent", "newName"]
        var srcPath = args[0];
        var parentFullPath = args[1];
        var name = args[2];

        //name can't be invalid
        if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(name)) {
            fail(FileError.ENCODING_ERR);
            return;
        }
        // copy
        var copyFiles = "";
        if (this.isFile) {
            copyFiles = function (srcPath, parentPath) {
                Windows.Storage.StorageFile.getFileFromPathAsync(srcPath).then(function (storageFile) {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolder) {
                        storageFile.copyAsync(storageFolder, name, Windows.Storage.NameCollisionOption.failIfExists).then(function (storageFile) {

                            success(new FileEntry(storageFile.name, storageFile.path));
                        }, function () {

                            fail(FileError.INVALID_MODIFICATION_ERR);
                        });
                    }, function () {

                        fail(FileError.NOT_FOUND_ERR);
                    });
                }, function () {

                    fail(FileError.NOT_FOUND_ERR);
                });
            };
        }

        if (this.isDirectory) {
            copyFiles = function (srcPath, parentPath) {
                return new WinJS.Promise(function (complete) {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(srcPath).then(function (storageFolder) {
                        storageFolder.createFileQuery().getFilesAsync().then(function (fileList) {
                            var filePromiseArr = [];
                            if (fileList) {
                                Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (targetStorageFolder) {
                                    for (var i = 0; i < fileList.length; i++) {
                                        filePromiseArr.push(fileList[i].copyAsync(targetStorageFolder));
                                    }
                                    WinJS.Promise.join(filePromiseArr).then(function () {
                                        storageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                            var folderPromiseArr = [];
                                            if (folderList.length === 0) { complete(); }
                                            else {

                                                Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolderTarget) {
                                                    var tempPromiseArr = [];
                                                    var index = 0;
                                                    for (var j = 0; j < folderList.length; j++) {
                                                        tempPromiseArr[index++] = storageFolderTarget.createFolderAsync(folderList[j].name).then(function (targetFolder) {
                                                            folderPromiseArr.push(copyFiles(folderList[j].path, targetFolder.path));
                                                        });
                                                    }
                                                    WinJS.Promise.join(tempPromiseArr).then(function () {
                                                        WinJS.Promise.join(folderPromiseArr).then(complete);
                                                    });
                                                });
                                            }
                                        });
                                    });
                                });
                            }
                        });
                    });
                });
            };
        }

        // copy
        var isFile = this.isFile;
        var isDirectory = this.isDirectory;
        var copyFinish = function (srcPath, parentPath) {
            if (isFile) {
                copyFiles(srcPath, parentPath);
            }
            if (isDirectory) {
                Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function(storageFolder){
                    storageFolder.createFolderAsync(name, Windows.Storage.CreationCollisionOption.openIfExists).then(function (newStorageFolder) {
                        //can't copy onto itself
                        if (srcPath == newStorageFolder.path) {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                            return;
                        }
                        //can't copy into itself
                        if (srcPath == parentPath) {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                            return;
                        }
                        copyFiles(srcPath, newStorageFolder.path).then(function () {
                            Windows.Storage.StorageFolder.getFolderFromPathAsync(newStorageFolder.path).done(
                                function (storageFolder) {
                                success(new DirectoryEntry(storageFolder.name, storageFolder.path));
                                },
                                function () { fail(FileError.NOT_FOUND_ERR); }
                            );
                        });
                    }, function () { fail(FileError.INVALID_MODIFICATION_ERR); });
                }, function () { fail(FileError.INVALID_MODIFICATION_ERR);});
            }
        };
        copyFinish(srcPath, parentFullPath);
    },

    moveTo:function(win,fail,args) { // ["fullPath","parent", "newName"]
        var srcPath = args[0];
        var parentFullPath = args[1];
        var name = args[2];


        //name can't be invalid
        if (/\?|\\|\*|\||\"|<|>|\:|\//g.test(name)) {
            fail(FileError.ENCODING_ERR);
            return;
        }

        var moveFiles = "";


        if (this.isFile) {
            moveFiles = function (srcPath, parentPath) {
                Windows.Storage.StorageFile.getFileFromPathAsync(srcPath).then(function (storageFile) {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolder) {
                        storageFile.moveAsync(storageFolder, name, Windows.Storage.NameCollisionOption.replaceExisting).then(function () {
                            success(new FileEntry(name, storageFile.path));
                        }, function () {
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        });
                    }, function () {
                        fail(FileError.NOT_FOUND_ERR);
                    });
                },function () {
                    fail(FileError.NOT_FOUND_ERR);
                });
            };
        }

        if (this.isDirectory) {
            moveFiles = function (srcPath, parentPath) {
                return new WinJS.Promise(function (complete) {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(srcPath).then(function (storageFolder) {
                        storageFolder.createFileQuery().getFilesAsync().then(function (fileList) {
                            var filePromiseArr = [];
                            Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (dstStorageFolder) {
                                if (fileList) {
                                    for (var i = 0; i < fileList.length; i++) {
                                        filePromiseArr.push(fileList[i].moveAsync(dstStorageFolder));
                                    }
                                }
                                WinJS.Promise.join(filePromiseArr).then(function () {
                                    storageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                        var folderPromiseArr = [];
                                        if (folderList.length === 0) {
                                            // If failed, we must cancel the deletion of folders & files.So here wo can't delete the folder.
                                            complete();
                                        }
                                        else {
                                            Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolderTarget) {
                                                var tempPromiseArr = [];
                                                var index = 0;
                                                for (var j = 0; j < folderList.length; j++) {
                                                    tempPromiseArr[index++] = storageFolderTarget.createFolderAsync(folderList[j].name).then(function (targetFolder) {
                                                        folderPromiseArr.push(moveFiles(folderList[j].path, targetFolder.path));
                                                    });
                                                }
                                                WinJS.Promise.join(tempPromiseArr).then(function () {
                                                    WinJS.Promise.join(folderPromiseArr).then(complete);
                                                });
                                            });
                                        }
                                    });
                                }, function () { });
                            });
                        });
                    });
                });
            };
        }

        // move
        var isDirectory = this.isDirectory;
        var isFile = this.isFile;
        var moveFinish = function (srcPath, parentPath) {

            if (isFile) {
                //can't copy onto itself
                if (srcPath == parentPath + "\\" + name) {
                    fail(FileError.INVALID_MODIFICATION_ERR);
                    return;
                }
                moveFiles(srcPath, parentFullPath);
            }
            if (isDirectory) {
                Windows.Storage.StorageFolder.getFolderFromPathAsync(srcPath).then(function (originFolder) {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(parentPath).then(function (storageFolder) {
                        storageFolder.createFolderAsync(name, Windows.Storage.CreationCollisionOption.openIfExists).then(function (newStorageFolder) {
                            //can't move onto directory that is not empty
                            newStorageFolder.createFileQuery().getFilesAsync().then(function (fileList) {
                                newStorageFolder.createFolderQuery().getFoldersAsync().then(function (folderList) {
                                    if (fileList.length !== 0 || folderList.length !== 0) {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                        return;
                                    }
                                    //can't copy onto itself
                                    if (srcPath == newStorageFolder.path) {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                        return;
                                    }
                                    //can't copy into itself
                                    if (srcPath == parentPath) {
                                        fail(FileError.INVALID_MODIFICATION_ERR);
                                        return;
                                    }
                                    moveFiles(srcPath, newStorageFolder.path).then(function () {
                                        var successCallback = function () { success(new DirectoryEntry(name, newStorageFolder.path)); }
                                        new DirectoryEntry(originFolder.name, originFolder.path).removeRecursively(successCallback, fail);

                                    }, function () { console.log("error!"); });
                                });
                            });
                        }, function () { fail(FileError.INVALID_MODIFICATION_ERR); });
                    }, function () { fail(FileError.INVALID_MODIFICATION_ERR); });
                }, function () { fail(FileError.INVALID_MODIFICATION_ERR); });
            }
        };
        moveFinish(srcPath, parentFullPath);
    },

    tempFileSystem:null,
    persistentFileSystem:null,
    requestFileSystem:function(win,fail,args) {
        var type = args[0];
        var size = args[1];

        var filePath = "";
        var result = null;
        var fsTypeName = "";

        switch (type) {
            case LocalFileSystem.TEMPORARY:
                filePath = FileSystemTemproraryRoot;
                fsTypeName = "temporary";
                break;
            case LocalFileSystem.PERSISTENT:
                filePath = FileSystemPersistentRoot;
                fsTypeName = "persistent";
                break;
        }

        var MAX_SIZE = 10000000000;
        if (size > MAX_SIZE) {
            fail(FileError.QUOTA_EXCEEDED_ERR);
            return;
        }

        var fileSystem = new FileSystem(fsTypeName, new DirectoryEntry(fsTypeName, filePath));
        result = fileSystem;
        win(result);
    },

    resolveLocalFileSystemURI:function(win,fail,args) {
        var uri = args[0];

        var path = uri;
        path = path.split(" ").join("\ ");

        // support for file name with parameters
        if (/\?/g.test(path)) {
            path = String(path).split("\?")[0];
        }

        // support for encodeURI
        if (/\%5/g.test(path)) {
            path = decodeURI(path);
        }

        // support for special path start with file:///
        if (path.substr(0, 8) == "file:///") {
            path = FileSystemPersistentRoot + "\\" + String(path).substr(8).split("/").join("\\");
            Windows.Storage.StorageFile.getFileFromPathAsync(path).then(
                function (storageFile) {
                    success(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(
                        function (storageFolder) {
                            success(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail(FileError.NOT_FOUND_ERR);
                        }
                    );
                }
            );
        } else {
            Windows.Storage.StorageFile.getFileFromPathAsync(path).then(
                function (storageFile) {
                    success(new FileEntry(storageFile.name, storageFile.path));
                }, function () {
                    Windows.Storage.StorageFolder.getFolderFromPathAsync(path).then(
                        function (storageFolder) {
                            success(new DirectoryEntry(storageFolder.name, storageFolder.path));
                        }, function () {
                            fail(FileError.ENCODING_ERR);
                        }
                    );
                }
            );
        }
    }

};