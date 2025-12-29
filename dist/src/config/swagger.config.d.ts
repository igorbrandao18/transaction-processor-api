import { SwaggerDocumentOptions } from '@nestjs/swagger';
export declare const swaggerConfig: Omit<import("@nestjs/swagger").OpenAPIObject, "paths">;
export declare const swaggerDocumentOptions: SwaggerDocumentOptions;
export declare const swaggerSetupOptions: {
    swaggerOptions: {
        persistAuthorization: boolean;
        displayRequestDuration: boolean;
        filter: boolean;
        showExtensions: boolean;
        showCommonExtensions: boolean;
        docExpansion: string;
        defaultModelsExpandDepth: number;
        defaultModelExpandDepth: number;
    };
};
