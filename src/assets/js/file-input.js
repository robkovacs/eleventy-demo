class FileInput {
    constructor(fileInput) {
        this.dropzone = fileInput.querySelector(".file-input__dropzone");
        this.input = fileInput.querySelector(".file-input__input");
        this.button = fileInput.querySelector(".file-input__button");
        this.fileListContainer = fileInput.querySelector(".file-list");
        this.messageListContainer = fileInput.querySelector(
            ".input-message__list",
        );

        // Props
        this.multiple = this.input.multiple;
        this.accept = this.parseAccept();
        this.acceptErrorMessage = this.input.dataset.acceptErrorMessage;
        this.maxFileSize = parseInt(this.input.dataset.maxFileSize, 10);
        this.maxFileSizeErrorMessage =
            this.input.dataset.maxFileSizeErrorMessage;

        this.maxFileCount = parseInt(this.input.dataset.maxFileCount, 10);
        this.maxFileCountErrorMessage =
            this.input.dataset.maxFileCountErrorMessage;
        this.netDragEvents = 0; // dragenter/leave + child nodes gets weird

        // State
        this.previouslyAddedFiles = [];

        this.addEventListeners();
    }

    parseAccept() {
        if (this.input.getAttribute("accept")) {
            return this.input
                .getAttribute("accept")
                .split(",")
                .map((item) => item.trim());
        }

        return [];
    }

    addEventListeners() {
        this.input.addEventListener("change", (e) => {
            this.processNewFiles(e);
        });

        this.button.addEventListener("click", (e) => {
            if (!this.multiple && this.input.files.length) {
                this.dropzone.classList.remove("file-input__dropzone--filled");
                this.button.classList.remove("button--style-danger");
                this.button.classList.add("button--style-brand");
                this.input.value = null;
            } else {
                this.input.click();
            }
        });

        this.dropzone.addEventListener("dragenter", (e) => {
            e.stopPropagation();
            e.preventDefault();

            if (
                !e.currentTarget.classList.contains(
                    "file-input__dropzone--dragged-over",
                )
            ) {
                e.currentTarget.classList.add(
                    "file-input__dropzone--dragged-over",
                );
            }

            this.netDragEvents++;
        });

        this.dropzone.addEventListener("dragleave", (e) => {
            e.stopPropagation();
            e.preventDefault();

            this.netDragEvents--;

            if (this.netDragEvents === 0) {
                e.currentTarget.classList.remove(
                    "file-input__dropzone--dragged-over",
                );
            }
        });

        this.dropzone.addEventListener("dragover", (e) => {
            e.stopPropagation();
            e.preventDefault();
        });

        this.dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove(
                "file-input__dropzone--dragged-over",
            );

            this.processNewFiles(e);
        });
    }

    processNewFiles(e) {
        let tempDataTransfer = new DataTransfer();
        let newFiles = [];

        if (e.dataTransfer) {
            if (e.dataTransfer.items) {
                [...e.dataTransfer.items].forEach((item) => {
                    if (item.kind === "file" && item.type) {
                        newFiles.push(item.getAsFile());
                    }
                });
            } else {
                [...e.dataTransfer.files].forEach((file) => {
                    if (file.type) {
                        newFiles.push(file);
                    }
                });
            }
        } else {
            [...this.input.files].forEach((file) => {
                if (file.type) {
                    newFiles.push(file);
                }
            });
        }

        let uniqueFiles = [];
        if (this.previouslyAddedFiles.length) {
            uniqueFiles = this.previouslyAddedFiles.concat(
                newFiles.filter((newFile) => {
                    /*
                        There's not a simple way in JS to know whether two given files are *truly* duplicates of each other.
                        Similarly, the easier ways of comparing arrays don't seem to work when File objects are involved.
                        This seems to be the best we can do, but there's a chance of false positives and negatives.
                    */
                    let isKeeper = true;
                    this.previouslyAddedFiles.forEach((previousFile) => {
                        if (
                            previousFile.name === newFile.name &&
                            previousFile.size === newFile.size &&
                            previousFile.type === newFile.type &&
                            previousFile.lastModified === newFile.lastModified
                        ) {
                            isKeeper = false;
                        }
                    });

                    return isKeeper;
                }),
            );
        } else {
            uniqueFiles = newFiles;
        }

        uniqueFiles.forEach((file) => {
            tempDataTransfer.items.add(file);
        });

        this.input.files = tempDataTransfer.files;
        this.previouslyAddedFiles = [...this.input.files];

        this.populateUI();
    }

    populateUI() {
        const uiData = this.validateFiles();

        if (!this.multiple) {
            // single file input
            this.messageListContainer.replaceChildren();

            if (this.input.files.length) {
                if (
                    !this.dropzone.classList.contains(
                        "file-input__dropzone--filled",
                    )
                ) {
                    this.dropzone.classList.add("file-input__dropzone--filled");
                    this.button.classList.add("button--style-danger");
                    this.button.classList.remove("button--style-brand");
                }

                let fileNameSlot = this.dropzone.querySelector(
                    ".file-input__description-text--filled",
                );
                fileNameSlot.innerText = uiData[0].filename;

                /* TODO: figure out how to truncate the filename how we wanted */
            } else {
                this.dropzone.classList.remove("file-input__dropzone--filled");
                this.button.classList.remove("button--style-danger");
                this.button.classList.add("button--style-brand");

                uiData[0].errorMessages.forEach((errorMessage) => {
                    let inputMessageHTML = document
                        .createRange()
                        .createContextualFragment(
                            `<div class="input-message input-message--type-error"><span class="system-icon system-icon--size-md"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"> <path fill="currentColor" d="M12 13.5a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-1.5 0v5.25c0 .414.336.75.75.75Zm1.125 2.625a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z"></path> <path fill="currentColor" d="m21.31 7.521-4.833-4.834a1.505 1.505 0 0 0-1.056-.437H8.583c-.396 0-.783.161-1.06.44L2.686 7.521c-.282.284-.437.66-.437 1.059v6.835c0 .401.157.778.44 1.06l4.832 4.835c.282.283.659.438 1.06.438h6.835c.4 0 .777-.156 1.06-.44l4.835-4.832c.283-.282.438-.659.438-1.06V8.582c0-.395-.16-.781-.44-1.06ZM15.416 20.25l-6.835.001-4.832-4.834-.001-6.834L8.583 3.75h6.834v-.002l4.832 4.834.001 6.835-4.834 4.832Z"></path></svg></span> ${errorMessage}</div>`,
                        );
                    this.messageListContainer.appendChild(inputMessageHTML);
                });
            }
        } else {
            // multiple file input
            let tempDataTransfer = new DataTransfer();

            this.fileListContainer
                .querySelectorAll(".file-list-item__button--preview")
                .forEach((link) => {
                    URL.revokeObjectURL(link.getAttribute("href"));
                });

            this.fileListContainer.replaceChildren();

            uiData.forEach((fileData) => {
                let inputMessageList = document
                    .createRange()
                    .createContextualFragment(
                        `<div class="input-message__list"></div>`,
                    );

                fileData.errorMessages.forEach((errorMessage) => {
                    let inputMessageHTML = document
                        .createRange()
                        .createContextualFragment(
                            `<div class="input-message input-message--type-error"><span class="system-icon system-icon--size-md"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"> <path fill="currentColor" d="M12 13.5a.75.75 0 0 0 .75-.75V7.5a.75.75 0 0 0-1.5 0v5.25c0 .414.336.75.75.75Zm1.125 2.625a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z"></path> <path fill="currentColor" d="m21.31 7.521-4.833-4.834a1.505 1.505 0 0 0-1.056-.437H8.583c-.396 0-.783.161-1.06.44L2.686 7.521c-.282.284-.437.66-.437 1.059v6.835c0 .401.157.778.44 1.06l4.832 4.835c.282.283.659.438 1.06.438h6.835c.4 0 .777-.156 1.06-.44l4.835-4.832c.283-.282.438-.659.438-1.06V8.582c0-.395-.16-.781-.44-1.06ZM15.416 20.25l-6.835.001-4.832-4.834-.001-6.834L8.583 3.75h6.834v-.002l4.832 4.834.001 6.835-4.834 4.832Z"></path></svg></span> ${errorMessage}</div>`,
                        );

                    inputMessageList.children[0].appendChild(inputMessageHTML);
                });

                let fileListItemHTML = document
                    .createRange()
                    .createContextualFragment(
                        `<div class="file-list-item"><div><span class="file-list-item__filename">${fileData.filename}</span></div><div class="file-list-item__buttons"><a class="file-list-item__button file-list-item__button--preview" href="${fileData.objectURL}" target="_blank" aria-label="Preview file"></a><button class="file-list-item__button file-list-item__button--remove" aria-label="Remove file" /></div></div>`,
                    );

                fileListItemHTML.children[0].children[0].appendChild(
                    inputMessageList,
                );

                this.fileListContainer.appendChild(fileListItemHTML);
            });

            let removeButtons = document.querySelectorAll(
                ".file-list-item__button--remove",
            );

            removeButtons.forEach((button, index) => {
                button.addEventListener("click", (e) => {
                    e.target.closest(".file-list-item").remove();
                    let tempDataTransfer = new DataTransfer();
                    let fileArray = [...this.input.files];

                    fileArray.splice(index, 1);

                    fileArray.forEach((file) => {
                        tempDataTransfer.items.add(file);
                    });

                    this.input.files = tempDataTransfer.files;
                    // this.populateUI();
                    // TODO: properly handle the set of intended files being re-evaluated with each removal (in case it gets us below maxFileCount)
                });
            });
        }
    }

    validateFiles() {
        /*
            * remove invalid files from this.input.files (so that they aren't submitted, not that it matters)
            * return what is needed to populate the UI with files and/or errors. per file:
                - filename
                - error message (if any)
                - objectURL (if this.multiple)
        */

        let tempDataTransfer = new DataTransfer();
        let uiData = [];

        [...this.input.files].forEach((file, index) => {
            let isAcceptable = false,
                errorMessages = [];

            if (this.accept.length) {
                this.accept.forEach((criterion) => {
                    if (criterion[0] === ".") {
                        if (file.name.endsWith(criterion)) {
                            isAcceptable = true;
                        }
                    } else if (file.type === criterion) {
                        isAcceptable = true;
                    } else if (
                        criterion.slice(-1) === "*" &&
                        file.type.startsWith(criterion.slice(0, -1))
                    ) {
                        isAcceptable = true;
                    }
                });
            } else {
                isAcceptable = true;
            }

            if (!isAcceptable) {
                errorMessages.push(this.acceptErrorMessage);
            }

            if (this.maxFileSize && file.size > this.maxFileSize) {
                errorMessages.push(this.maxFileSizeErrorMessage);
            }

            if (this.maxFileCount && index >= this.maxFileCount) {
                errorMessages.push(this.maxFileCountErrorMessage);
            }

            if (!errorMessages.length) {
                tempDataTransfer.items.add(file);
            }

            uiData.push({
                filename: file.name,
                errorMessages: errorMessages,
                objectURL: this.multiple ? URL.createObjectURL(file) : null,
            });
        });

        this.input.files = tempDataTransfer.files;

        return uiData;
    }
}

let fileInputs = document.querySelectorAll(".file-input");
fileInputs.forEach((fileInput) => {
    new FileInput(fileInput);
});
