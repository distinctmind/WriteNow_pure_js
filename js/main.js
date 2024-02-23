const localStorageKey = "writenow-notes";

// Local Storage
class NotesAPI {

    static getAllNotes() {
        const notes = JSON.parse(localStorage.getItem(localStorageKey) || "[]");
        return notes;
    }
    static saveNote(noteToSave) {
        const notes = this.getAllNotes();
        const existing = notes.find(note => note.id == noteToSave.id);

        if (existing) {
            existing.title = noteToSave.title;
            existing.body = noteToSave.body;
            existing.updated = new Date().toISOString();
        } else {
            noteToSave.id = Math.floor(Math.random() * 1000000);
            noteToSave.created = new Date().toISOString();
            noteToSave.updated = new Date().toISOString();
            notes.push(noteToSave);
        }
        localStorage.setItem(localStorageKey, JSON.stringify(notes));
    }
    
    static deleteNote(id) {
        const notes = this.getAllNotes();
        const newNotes = notes.filter(note => note.id != id);
        localStorage.setItem(localStorageKey, JSON.stringify(newNotes));
    }
    static deleteAllNotes(){
        localStorage.clear();
    }
}

// UI View
class NotesView {
    constructor(root, { onNoteSelect, onNoteAdd, onNoteEdit, onNoteDelete, onNotesClear } = {}) {
        this.root = root;
        this.onNoteSelect = onNoteSelect;
        this.onNoteAdd = onNoteAdd;
        this.onNoteEdit = onNoteEdit;
        this.onNoteDelete = onNoteDelete;
        this.onNotesClear = onNotesClear;
        this.root.innerHTML = `
        <div class="notes__sidebar">
            <button class="notes__add" type="button">
                Add Note
            </button>
            <div class="notes__list"></div>
            <button class="notes__clear" type="button">Clear All</button>
        </div>
        <div class="notes__preview">
            <input class="notes__title" type="text" placeholder="New note">
            <textarea class="notes__body"></textarea>
        </div>
        `;

        const addNoteBtn = this.root.querySelector(".notes__add");
        const clearNotesBtn = this.root.querySelector(".notes__clear");
        const noteTitle = this.root.querySelector(".notes__title");
        const noteBody = this.root.querySelector(".notes__body");

        addNoteBtn.addEventListener("click", () => {
            this.onNoteAdd();
        });

        clearNotesBtn.addEventListener("click", () => {
            const doClear = confirm("Are you sure you want to clear all notes");
                if (doClear) {
                    this.onNotesClear();
                }
        });

        [noteTitle, noteBody].forEach(inputField => {
            inputField.addEventListener("blur", () => {
                const updatedTitle = noteTitle.value;
                const updatedBody = noteBody.value;

                this.onNoteEdit(updatedTitle, updatedBody)
            })
        });
        this.updateNotePreviewVisibility(false);
    }

    _createListItemHTML(id, title, body, updated) {
        const MAX_BODY_LENGTH = 60;
        return `
            <div class="notes__list-item" data-note-id="${id}">
                <div class="notes__small-title">${title}</div>
                <div class="notes__small-body">
                    ${body.substring(0, MAX_BODY_LENGTH)}
                    ${body.length > MAX_BODY_LENGTH ? "..." : ""}
                </div>
                <div class="notes__small-updated">
                    ${updated.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short"})}
                </div>
            </div>
        `;
    }

    updateNoteList(notes) {
        const notesListContainer = this.root.querySelector(".notes__list");
        notesListContainer.innerHTML = "";
        for (const note of notes) {
            const html = this._createListItemHTML(note.id, note.title, note.body, new Date(note.updated));
            notesListContainer.insertAdjacentHTML("beforeend", html);
        }

        notesListContainer.querySelectorAll(".notes__list-item").forEach(noteListItem => {
            noteListItem.addEventListener("click", () => {
                this.onNoteSelect(noteListItem.dataset.noteId);
            });

            noteListItem.addEventListener("dblclick", () => {
                const doDelete = confirm("Are you sure you want to delete this note?");
                if (doDelete) {
                    this.onNoteDelete(noteListItem.dataset.noteId);
                }
            })
        });

    }

    updateActiveNote(note) {
        this.root.querySelector(".notes__title").value = note.title;
        this.root.querySelector(".notes__body").value = note.body;

        this.root.querySelectorAll(".notes__list-item").forEach(noteListItem => {
            noteListItem.classList.remove("notes__list-item--selected");
        });

        this.root.querySelector(`.notes__list-item[data-note-id="${note.id}"]`).classList.add("notes__list-item--selected");
    }

    updateNotePreviewVisibility(visible) {
        this.root.querySelector(".notes__preview").style.visibility = visible ? "visible" : "hidden";
    }

}

// Parent
class App {
    constructor(root) {
        this.notes = [];
        this.activeNote = null;
        this.view = new NotesView(root, this._handlers());
        this._refreshNotes();
    }

    _refreshNotes() {
        const notes = NotesAPI.getAllNotes();
        this._setNotes(notes);

        if (notes.length > 0) {
            if (this.activeNote) {
                this._setActiveNote(notes.find(note => note.id == this.activeNote.id));
            } else {
                this._setActiveNote(notes[notes.length - 1]);
            }
        }
    }

    _setNotes(notes){
        this.notes = notes;
        this.view.updateNoteList(notes);
        this.view.updateNotePreviewVisibility(notes.length > 0);
    }

    _setActiveNote(note){
        this.activeNote = note;
        this.view.updateActiveNote(note);
    }

    _handlers() {
        return {
            onNoteSelect: noteId => {
                const selectedNote = this.notes.find(note => note.id == noteId);
                this._setActiveNote(selectedNote);
            },
            onNoteAdd: () => {
                const newNote = {
                    title: "",
                    body: "",
                };
                this.activeNote = null;
                NotesAPI.saveNote(newNote);
                this._refreshNotes();
            },
            onNoteEdit: (newTitle, newBody) => {
                const editedNote = {
                    id: this.activeNote.id,
                    title: newTitle,
                    body: newBody,
                };
                NotesAPI.saveNote(editedNote);
                this._refreshNotes();
            },
            onNoteDelete: noteId => {
                NotesAPI.deleteNote(noteId);
                this._refreshNotes();
            },
            onNotesClear: () => {
                NotesAPI.deleteAllNotes();
                this._refreshNotes();
            }
        };
    }
}

const root = document.getElementById("root");
const app = new App(root);

