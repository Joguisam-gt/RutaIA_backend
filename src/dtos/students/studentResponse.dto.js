/**
 * DTO orientado a objetos para formatear y sanitizar la respuesta pública del estudiante (SRP).
 * Garantiza que la capa de presentación solo reciba los atributos autorizados.
 */
export default class StudentResponseDTO {
    /**
     * Documento crudo recuperado de MongoDB.
     */
    constructor(student) {
        if (!student) {
            throw new Error('No se puede instanciar StudentResponseDTO con un objeto nulo o indefinido.');
        }

        this.id = student._id ? student._id.toString() : null;
        this.name = student.name || '';
        this.email = student.email || '';
        this.role = student.role || 'student';
        this.level = student.level || 'PRINCIPIANTE';
        this.areaOfInterest = student.areaOfInterest || 'General';
        this.createdAt = student.createdAt ? new Date(student.createdAt).toISOString() : null;

        // Congela el DTO de respuesta para impedir alteraciones
        Object.freeze(this);
    }

    /**
     * Método de fábrica estático para transformar una entidad individual.
     */
    static fromEntity(student) {
        return new StudentResponseDTO(student);
    }

    /**
     * Método de fábrica estático para transformar un arreglo de entidades de estudiantes.
     */
    static fromEntityList(studentsList = []) {
        return studentsList.map((student) => new StudentResponseDTO(student));
    }
}