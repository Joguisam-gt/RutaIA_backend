/**
 * DTO orientado a objetos para modelar y estandarizar la respuesta devuelta al cliente (SRP).
 */
export default class QueryResponseDTO {
    /**
     * Datos de la consulta recuperados de MongoDB / respuesta de n8n.
     * Identificador único de la consulta.
     * Texto explicativo generado por el motor RAG.
     * Alias devuelto por n8n.
     * Lista de fragmentos/cursos fuentes recuperados de Qdrant.
     * Grado o promedio de similitud vectorial (0 a 1).
     * Estado del ciclo de vida de la consulta.
     * Fecha de creación del registro.
     */
    constructor(queryData) {
        if (!queryData) {
            throw new Error('No se puede instanciar QueryResponseDTO con un objeto nulo o indefinido.');
        }

        this.queryId = queryData._id ? queryData._id.toString() : (queryData.queryId || null);
        this.response = queryData.aiResponse || queryData.responseText || 'Sin respuesta disponible.';
        this.sources = QueryResponseDTO._formatSources(queryData.vectorSources || queryData.sources || []);
        this.similarity = QueryResponseDTO._formatSimilarity(queryData.similarityScore || queryData.similarity);
        this.status = queryData.status || 'RESPONDIDA';
        this.createdAt = queryData.createdAt ? new Date(queryData.createdAt).toISOString() : new Date().toISOString();

        // Congela la respuesta para evitar modificaciones accidentales
        Object.freeze(this);
    }

    /**
     * Sanitiza y estandariza la estructura de las fuentes vectoriales devueltas por Qdrant.
     * @private
     */
    static _formatSources(sources) {
        if (!Array.isArray(sources)) return [];

        return sources.map((source) => ({
            courseId: source.courseId || source.course_id || null,
            title: source.title || 'Curso Recomendado',
            category: source.category || 'General',
            chunkSnippet: source.chunkSnippet || source.text_chunk || '',
            score: typeof source.score === 'number' ? Number(source.score.toFixed(4)) : null
        }));
    }

    /**
     * Normaliza el puntaje de similitud semántica.
     */
    static _formatSimilarity(similarity) {
        if (typeof similarity === 'number') {
            return Number(similarity.toFixed(4));
        }
        return null;
    }

    /**
     * Método de fábrica estático para crear el DTO de respuesta desde el modelo/entidad.
     * @param {Object} queryEntity 
     * @returns {QueryResponseDTO}
     */
    static fromEntity(queryEntity) {
        return new QueryResponseDTO(queryEntity);
    }

    /**
     * Método de fábrica estático para colecciones de historial de consultas.
     */
    static fromEntityList(queryEntitiesList = []) {
        return queryEntitiesList.map((entity) => new QueryResponseDTO(entity));
    }
}