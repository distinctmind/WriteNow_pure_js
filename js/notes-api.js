export default class NotesAPI {
    
    static getAllNotes() {
        const notes = JSON.parse(localStorage.getItem("writenow-notes") || "[]");
        return notes;
    }
    static saveNote(noteToSave) {

    }

    static deleteNote(id) {

    }

}