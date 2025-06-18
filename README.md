# Bloom Learning Platform

Bloom is an AI-powered learning platform that combines personalized curriculum generation with advanced text-to-speech capabilities. The platform is designed to create engaging, accessible educational content for diverse learning needs.

## Features

### Teacher Upload Interface
- PDF textbook upload and processing
- Automatic text extraction with smart formatting
- Character-limited text summaries (3000 chars) for better processing
- Audio generation summaries (100 chars) for concise TTS output

### Text-to-Speech (TTS) System
- Integration with Chatterbox TTS API
- Multiple voice selection support
- Real-time audio generation
- Audio history and playback
- Voice library management
- Advanced TTS settings (exaggeration, temperature, etc.)

### Curriculum Management
- Dynamic curriculum generation from textbooks
- Chapter organization and structuring
- Interactive roadmap visualization
- Progress tracking
- Module-based learning paths

### User Interface
- Clean, modern design with black/white theme
- Responsive layout
- Intuitive navigation
- Progress indicators
- Interactive chapter links

### Accessibility
- Text-to-speech support for content
- Clear typography and contrast
- Responsive design for various devices
- Keyboard navigation support

## Deployment

### Prerequisites
1. Node.js (v18 or higher)
2. Python 3.8 or higher (for Chatterbox TTS API)
3. Git

### Dependencies

#### Frontend (Bloom Platform)
```bash
npm install
# or
yarn install
```

#### Chatterbox TTS API Dependencies
Follow the installation instructions from [Chatterbox's README](https://github.com/chatterbox/tts-api):

```bash
pip install torch torchaudio
pip install fastapi
pip install uvicorn
pip install python-multipart
pip install soundfile
```

### Environment Setup

1. Clone the repositories:
```bash
# Clone Bloom platform
git clone https://github.com/your-username/bloom.git
cd bloom

# Clone Chatterbox TTS API (in a separate directory)
git clone https://github.com/chatterbox/tts-api.git
cd chatterbox-tts-api
```

2. Set up environment variables:
Create a `.env.local` file in the Bloom platform root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_TTS_API_URL=http://localhost:4123
```

### Running the Application

1. Start the Chatterbox TTS API (Port 4123):
```bash
cd chatterbox-tts-api
uvicorn main:app --host 0.0.0.0 --port 4123
```

2. Start the Bloom platform (in a new terminal):
```bash
cd bloom
npm run dev
# or
yarn dev
```

The application will be available at:
- Frontend: http://localhost:3000
- TTS API: http://localhost:4123

### Production Deployment

For production deployment:

1. Build the frontend:
```bash
npm run build
# or
yarn build
```

2. Start the production server:
```bash
npm start
# or
yarn start
```

3. Deploy the TTS API:
- Set up a production server with Python environment
- Install all required dependencies
- Use a process manager like PM2 or systemd to run the uvicorn server
- Configure proper security measures and API keys

## Development

### Tech Stack
- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS
- TTS API: FastAPI, Python
- Database: Supabase
- PDF Processing: PDF.js

### Project Structure
```
bloom/
├── app/                    # Next.js app directory
│   ├── components/        # Reusable components
│   ├── teacher-upload/    # Teacher upload feature
│   ├── chapter/          # Chapter view features
│   └── lesson/           # Lesson components
├── public/               # Static assets
└── utils/               # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[Your chosen license]

## Support

For support, please [create an issue](https://github.com/your-username/bloom/issues) or contact the development team.
