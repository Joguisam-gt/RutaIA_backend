// src/services/student.service.js
import studentRepositoryInstance from '../repositories/student.repository.js';
import StudentResponseDTO from '../dtos/student/studentResponse.dto.js';
import BadRequestError from '../errors/badRequestError.js';
import AppError from '../errors/appError.js';
import logger from '../utils/logger.js';

/**
 * Servicio orientado a objetos para la gestión de la lógica de negocio de estudiantes (SRP & DIP).
 * Valida la existencia previa de correos electrónicos y coordina el acceso a datos.
 */
export default class StudentService {
    /**
     * Inyección de dependencias a través del constructor.
     * Instancia del repositorio de estudiantes.
     */
    constructor(studentRepository = studentRepositoryInstance) {
        this.studentRepository = studentRepository;
    }

    /**
     * Registra un nuevo estudiante verificando previamente que el email no esté duplicado.
     *  DTO validado con los datos del estudiante.
     *  DTO de respuesta sanitizado.
     */
    async registerStudent(studentDto) {
        // 1. Verificación de duplicidad de correo electrónico
        const existingStudent = await this.studentRepository.findByEmail(studentDto.email);
        if (existingStudent) {
            throw new BadRequestError(`El correo electrónico '${studentDto.email}' ya se encuentra registrado en la plataforma.`);
        }

        // 2. Preparación del documento para persistencia
        const newStudentData = {
            name: studentDto.name,
            email: studentDto.email.toLowerCase().trim(),
            level: studentDto.level,
            areaOfInterest: studentDto.areaOfInterest,
            role: 'student'
        };

        // 3. Persistencia en MongoDB
        const createdStudent = await this.studentRepository.create(newStudentData);
        logger.info(`Nuevo estudiante registrado exitosamente con ID: ${createdStudent._id}`);

        // 4. Retorno de DTO de respuesta sin exponer datos sensibles de infraestructura
        return StudentResponseDTO.fromEntity(createdStudent);
    }

    /**
     * Obtiene la información del perfil del estudiante por su identificador único.
     * ID del estudiante en MongoDB.
     * 
     */
    async getStudentById(studentId) {
        const student = await this.studentRepository.findById(studentId);
        if (!student) {
            throw new AppError('El estudiante solicitado no existe o fue removido.', 404);
        }
        return StudentResponseDTO.fromEntity(student);
    }

    /**
     * Obtiene el listado paginado de todos los estudiantes registrados.
     *  Cantidad de registros por página.
     *  Número de página.
     */
    async getAllStudents(limit = 20, page = 1) {
        const students = await this.studentRepository.findAllStudents(limit, page);
        return StudentResponseDTO.fromEntityList(students);
    }
}