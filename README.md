# MarkFlow Editor

**MarkFlow Editor** is an intelligent structured document editor that combines the power of markdown with AI-assisted content generation. It allows users to create, edit, and organize content in blocks while leveraging AI to generate structured data based on defined output variables.

## ✨ Features

### 📝 Block-Based Editing
- **Multi-Block Types**: Support for headings (H1-H6), paragraphs, lists, code blocks, tables, quotes, images, and links
- **Drag & Drop Reordering**: Easily rearrange blocks with intuitive controls
- **Block Naming**: Assign names to blocks for easy reference and embedding
- **Real-time Preview**: Live preview of markdown content with variable interpolation

### 🔗 Cross-File Block Embedding
- **Block Embedding**: Embed blocks from other files using link references
- **Inline Functionality**: Convert embedded blocks to independent copies
- **Smart Preview**: Embedded blocks show their actual content in preview mode
- **Visual Indicators**: Clear visual distinction for embedded vs. native blocks

### 🤖 AI-Powered Content Generation
- **Anthropic Claude Integration**: Powered by Claude AI for intelligent content generation
- **Structured Output**: Generate content based on JSON schemas and output variables
- **Variable Management**: Define global and local variables with automatic AI population
- **Schema Generation**: Auto-generate JSON schemas from defined output variables
- **Prompt Engineering**: Built-in system for crafting effective AI prompts

### 🗂️ Project Management
- **Multi-File Projects**: Organize content across multiple files
- **Variable Scoping**: Global and file-local variable management
- **Import/Export**: Save and load entire projects as JSON
- **Auto-Save**: Persistent storage with save status indicators

### 🎨 User Interface
- **Modern Design**: Clean, intuitive interface built with Tailwind CSS
- **Responsive Layout**: Three-pane layout (sidebar, editor, preview)
- **Real-time Updates**: Live preview with variable substitution
- **Toast Notifications**: User feedback for all operations

## 🚀 Quick Start

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager
- Anthropic API key (for AI features)

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/markflow-editor.git
   cd markflow-editor
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Setup Backend Server**
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```

4. **Configure API Key**
   Edit `server/.env` and add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-your-api-key-here
   PORT=3001
   ```

### Running the Application

1. **Start Backend Server** (in `server/` directory):
   ```bash
   npm start
   # Or for development with auto-restart:
   npm run dev
   ```

2. **Start Frontend** (in project root):
   ```bash
   npm start
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 📖 Usage Guide

### Creating Your First Project

1. **Start with a New File**: Click "New File" in the sidebar
2. **Add Content Blocks**: Use the block selector to add different types of content
3. **Define Variables**: Set up output variables in the Variables tab
4. **Configure AI**: Set your API key in AI Settings
5. **Generate Content**: Use "Execute Prompt" to generate AI content

### Working with Blocks

#### Block Types
- **Headings (H1-H6)**: Structure your document with hierarchical headings
- **Paragraph**: Standard text content with variable support
- **Lists**: Ordered and unordered lists with auto-formatting
- **Code Blocks**: Syntax-highlighted code snippets
- **Tables**: Structured data with header and alignment support
- **Quotes**: Blockquoted text for emphasis
- **JSON Schema**: Define data structures for AI generation
- **Output Blocks**: Display AI-generated content
- **Embed Blocks**: Reference content from other files

#### Block Operations
- **Rename**: Double-click block names to edit
- **Reorder**: Use up/down arrows to move blocks
- **Delete**: Remove blocks with confirmation
- **Embed**: Link blocks from other files

### Variable Management

#### Global Variables
- Available across all files in the project
- Managed in the Variables tab (left sidebar)
- Support for different data types (string, number, boolean)

#### Local Variables
- Scoped to individual files
- Automatically created from AI responses
- Can be promoted to global scope

#### Output Variables
- Special variables marked as AI output targets
- Used to structure AI-generated content
- Automatically populate from AI responses

### AI Content Generation

#### Setup Process
1. **Configure API Key**: Go to AI Settings and enter your Anthropic API key
2. **Define Output Variables**: Mark variables as "output" in the Variables tab
3. **Create Schema** (optional): Add JSON Schema blocks for structured output
4. **Write Content**: Add markdown content for AI context

#### Generation Process
1. **View Prompt**: Use "View Prompt" to preview the AI prompt
2. **Execute**: Click "Execute Prompt" to generate content
3. **Review**: Check the Output block for generated content
4. **Variables**: Output variables are automatically updated

### Cross-File Embedding

#### Embedding Blocks
1. **Name Your Blocks**: Assign names to blocks you want to embed
2. **Use Embed Button**: Click the "Embed" button in the Files tab
3. **Select Source**: Choose the file and block to embed
4. **Reference**: The embedded block appears with source information

#### Inline Conversion
- **Convert to Copy**: Use the "Inline" button to convert embedded blocks to independent copies
- **Break Links**: Removes the reference and creates a local copy
- **Preserve Content**: Original content is maintained

### Project Management

#### File Operations
- **Create Files**: Add new files to organize content
- **Delete Files**: Remove files with confirmation
- **Switch Files**: Click files to switch editing context

#### Data Persistence
- **Auto-Save**: Projects are automatically saved to localStorage
- **Export**: Download entire projects as JSON files
- **Import**: Load previously exported project files

## 🏗️ Architecture

### Frontend (React + TypeScript)
```
src/
├── components/          # React components
│   ├── AI/             # AI-related components
│   ├── Editor/         # Block editing components
│   ├── Layout/         # Layout components
│   ├── Preview/        # Markdown preview
│   ├── UI/            # Common UI components
│   └── Variables/      # Variable management
├── contexts/           # React contexts
├── services/           # AI and data services
└── types/             # TypeScript type definitions
```

### Backend (Node.js + Express)
```
server/
├── server.js          # Main server file
├── package.json       # Dependencies
└── .env              # Environment configuration
```

### Key Technologies
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, CORS
- **AI**: Anthropic Claude API
- **Storage**: LocalStorage (frontend), JSON export/import
- **Styling**: Tailwind CSS with custom components

## 🔧 Configuration

### Environment Variables (Backend)
```env
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### AI Configuration
- **Model**: Claude-3.5-Sonnet (configurable)
- **Temperature**: 0.7 (adjustable in AI settings)
- **Max Tokens**: 1000 (configurable)
- **System Instructions**: Auto-generated based on schema

## 🎯 Use Cases

### Content Creation
- **Technical Documentation**: Structure technical docs with embedded code examples
- **Marketing Content**: Generate product descriptions with consistent formatting
- **Educational Materials**: Create structured lessons with AI-generated examples

### Data Management
- **Product Catalogs**: Manage product information with AI-generated descriptions
- **Content Templates**: Create reusable templates with variable substitution
- **Report Generation**: Generate structured reports with AI assistance

### Collaborative Editing
- **Content Libraries**: Share and reuse content blocks across projects
- **Template Systems**: Create standardized content structures
- **Version Control**: Track changes with metadata and timestamps

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Common Issues
- **CORS Errors**: Ensure backend server is running on port 3001
- **API Key Issues**: Verify your Anthropic API key is correctly configured
- **Storage Issues**: Check browser localStorage permissions

### Getting Help
- Check the [Issues](https://github.com/your-username/markflow-editor/issues) page
- Review the server README for backend-specific issues
- Ensure all dependencies are properly installed

## 🔮 Roadmap

- [ ] Real-time collaboration features
- [ ] Advanced AI model selection
- [ ] Plugin system for custom block types
- [ ] Cloud storage integration
- [ ] Version control and history
- [ ] Advanced theming and customization
- [ ] Mobile responsive editing
- [ ] Batch AI operations

---

**MarkFlow Editor** - Intelligent structured document editing with AI assistance.