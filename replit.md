# NFSe Reader Web Application

## Overview

This project is a web application for reading, parsing, and visualizing NFSe (Nota Fiscal de Serviço Eletrônica) XML files. The application allows users to upload XML files containing NFSe data, view the data in a paginated table, filter and sort the data, visualize data through charts, and export the data to Excel or PDF formats.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a client-server architecture:

1. **Frontend**: A browser-based UI built with HTML, CSS (using Tailwind), and JavaScript.
2. **Backend**: A Flask (Python) application that serves the frontend and likely provides API endpoints for processing XML data.
3. **Data Storage**: The application appears to be prepared for integration with a PostgreSQL database (as indicated by dependencies and configuration), though the current implementation may not yet use it.

This architecture was chosen for its simplicity and separation of concerns:
- Frontend handles user interactions and data visualization
- Backend processes XML files and manages data persistence

## Key Components

### Frontend Components

1. **XML File Upload**: Accepts XML files containing NFSe data via a file input or drag-and-drop interface.
2. **Data Visualization Dashboard**: Displays charts (using Chart.js) to visualize data such as tax information and status counts.
3. **Data Table**: Shows NFSe records with pagination, sorting, and filtering capabilities.
4. **Export Functionality**: Allows exporting data to Excel (using SheetJS) or PDF (using jsPDF and html2canvas).
5. **Modal Dialogs**: For warnings, loading states, and export options.

### Backend Components

1. **Flask Application**: Serves the static frontend files and likely provides API endpoints.
2. **Database Integration**: The project includes configuration for PostgreSQL, suggesting a relational database component.

## Data Flow

1. User uploads an XML file containing NFSe information
2. The XML data is parsed (either client-side in JavaScript or server-side in Python)
3. The parsed data is displayed in the UI's table with pagination
4. Dashboard charts are updated to reflect the data statistics
5. Users can filter, sort, and search the displayed data
6. Data can be exported to Excel or PDF formats

## External Dependencies

### Frontend Dependencies

1. **Tailwind CSS**: For UI styling via CDN
2. **Chart.js**: For data visualization
3. **jsPDF**: For PDF generation
4. **html2canvas**: For converting HTML to canvas for PDF export
5. **SheetJS**: For Excel export functionality
6. **Font Awesome**: For icons

### Backend Dependencies

1. **Flask**: Web framework for Python
2. **Flask-SQLAlchemy**: ORM for database interactions
3. **Gunicorn**: WSGI HTTP Server for deploying Flask applications
4. **Psycopg2**: PostgreSQL adapter for Python
5. **Email-validator**: For email validation

## Deployment Strategy

The application is configured for deployment in a Replit environment:

1. **Server**: Gunicorn is used as the production WSGI server
2. **Database**: PostgreSQL is included in the Nix configuration
3. **Autoscaling**: The deployment target is set to "autoscale" to handle varying loads
4. **Development Workflow**: The Replit configuration includes a run button that starts the application in development mode

The deployment strategy prioritizes ease of setup and scalability, with Gunicorn handling production-level HTTP requests and PostgreSQL providing a robust data storage solution.

## Future Improvements

1. Implement server-side XML processing for larger files
2. Complete database integration for persistent storage of NFSe data
3. Add user authentication for access control
4. Implement more advanced data analysis features
5. Add multilingual support (currently primarily in Portuguese)