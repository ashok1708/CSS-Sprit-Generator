import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from '@emotion/styled';
import { Button, Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem, TextField, Stack } from '@mui/material';
import { saveAs } from 'file-saver';



const CodeBlock = styled.pre`
  background: ${({ theme }) => theme.palette.mode === 'dark' 
    ? 'linear-gradient(145deg, #1e1e1e, #2d2d2d)'
    : 'linear-gradient(145deg, #f8f9fa, #e9ecef)'};
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#e0e0e0' : '#1a1a1a'};
  padding: 24px;
  border-radius: 12px;
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: ${({ theme }) => theme.palette.mode === 'dark'
    ? '0 4px 8px rgba(0, 0, 0, 0.3)'
    : '0 4px 8px rgba(0, 0, 0, 0.15)'};
  border: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#e0e0e0'};
`;

const StyledPaper = styled(Paper)`
  background-color: ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff'};
  border-radius: 16px;
  box-shadow: ${({ theme }) => theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.3)'
    : '0 4px 20px rgba(0, 0, 0, 0.08)'};
  padding: 32px;
  margin: 32px 0;
  border: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : 'transparent'};
`;

const DropzoneContainer = styled.div`
  border: 2px dashed ${({ theme }) => theme.palette.mode === 'dark' ? '#666' : '#3f51b5'};
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  cursor: pointer;
  margin: 24px 0;
  background-color: ${({ theme }) => theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(63, 81, 181, 0.05)'};
  transition: all 0.3s ease;
  box-shadow: ${({ theme }) => theme.palette.mode === 'dark'
    ? '0 4px 6px rgba(0, 0, 0, 0.2)'
    : '0 4px 6px rgba(0, 0, 0, 0.05)'};
  &:hover {
    border-color: ${({ theme }) => theme.palette.mode === 'dark' ? '#888' : '#1a237e'};
    background-color: ${({ theme }) => theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(63, 81, 181, 0.1)'};
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.palette.mode === 'dark'
      ? '0 6px 12px rgba(0, 0, 0, 0.3)'
      : '0 6px 12px rgba(0, 0, 0, 0.1)'};
  }
`;

const PreviewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 20px;
  margin: 32px 0;
  padding: 24px;
  background-color: ${({ theme }) => theme.palette.mode === 'dark' ? '#2d2d2d' : '#f8f9fa'};
  border-radius: 12px;
  box-shadow: inset ${({ theme }) => theme.palette.mode === 'dark'
    ? '0 2px 4px rgba(0, 0, 0, 0.2)'
    : '0 2px 4px rgba(0, 0, 0, 0.05)'};
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 140px;
  object-fit: contain;
  border: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#444' : '#e0e0e0'};
  border-radius: 8px;
  background-color: ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : 'white'};
  padding: 12px;
  transition: all 0.3s ease;
  box-shadow: ${({ theme }) => theme.palette.mode === 'dark'
    ? '0 2px 4px rgba(0, 0, 0, 0.2)'
    : '0 2px 4px rgba(0, 0, 0, 0.05)'};
  &:hover {
    transform: scale(1.05);
    box-shadow: ${({ theme }) => theme.palette.mode === 'dark'
      ? '0 4px 8px rgba(0, 0, 0, 0.3)'
      : '0 4px 8px rgba(0, 0, 0, 0.1)'};
  }
`;

const ResultContainer = styled.div`
  margin: 40px 0;
  padding: 24px;
  background-color: ${({ theme }) => theme.palette.mode === 'dark' ? '#2d2d2d' : '#f8f9fa'};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.palette.mode === 'dark'
    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
    : '0 2px 8px rgba(0, 0, 0, 0.05)'};
  border: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : 'transparent'};
`;

function App() {
  const [images, setImages] = useState([]);
  const [spriteUrl, setSpriteUrl] = useState(null);
  const [cssCode, setCssCode] = useState('');
  const [direction, setDirection] = useState('horizontal');
  const [spacing, setSpacing] = useState(10);
  const [classPrefix, setClassPrefix] = useState('sprite');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageWidth, setImageWidth] = useState('');
  const [imageHeight, setImageHeight] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    setImages(acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    })));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    }
  });

  const generateSprite = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let currentX = 0;
      let currentY = 0;
      let maxWidth = 0;
      let maxHeight = 0;

      // First pass to calculate dimensions
      const numImages = images.length;
      const numCols = Math.ceil(Math.sqrt(numImages));
      const numRows = Math.ceil(numImages / numCols);

      for (const file of images) {
        const originalImg = await createImageBitmap(file);
        let img = originalImg;

        // Resize image if dimensions are specified
        if (imageWidth || imageHeight) {
          const resizeCanvas = document.createElement('canvas');
          const resizeCtx = resizeCanvas.getContext('2d');
          const targetWidth = imageWidth ? parseInt(imageWidth) : originalImg.width;
          const targetHeight = imageHeight ? parseInt(imageHeight) : originalImg.height;
          
          resizeCanvas.width = targetWidth;
          resizeCanvas.height = targetHeight;
          resizeCtx.drawImage(originalImg, 0, 0, targetWidth, targetHeight);
          img = await createImageBitmap(resizeCanvas);
        }

        if (direction === 'horizontal') {
          maxHeight = Math.max(maxHeight, imageHeight ? parseInt(imageHeight) : img.height);
          currentX += (imageWidth ? parseInt(imageWidth) : img.width) + spacing;
          maxWidth = currentX - spacing;
        } else if (direction === 'vertical') {
          maxWidth = Math.max(maxWidth, imageWidth ? parseInt(imageWidth) : img.width);
          currentY += (imageHeight ? parseInt(imageHeight) : img.height) + spacing;
          maxHeight = currentY - spacing;
        } else if (direction === 'diagonal') {
          const imgWidth = imageWidth ? parseInt(imageWidth) : img.width;
          const imgHeight = imageHeight ? parseInt(imageHeight) : img.height;
          maxWidth = Math.max(maxWidth, imgWidth * numCols + spacing * (numCols - 1));
          maxHeight = Math.max(maxHeight, imgHeight * numRows + spacing * (numRows - 1));
        }
      }

      // Set canvas dimensions
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      currentX = 0;
      currentY = 0;

      // Generate CSS code
      let css = `.${classPrefix}-container {
  background-image: url('sprite.png');
  background-repeat: no-repeat;
}
`;
      
      // Second pass to draw images and generate CSS
      for (let i = 0; i < images.length; i++) {
        const originalImg = await createImageBitmap(images[i]);
        const fileName = images[i].name.split('.').slice(0, -1).join('.').replace(/[^a-z0-9]/gi, '-').toLowerCase();
        
        let img = originalImg;
        const targetWidth = imageWidth ? parseInt(imageWidth) : originalImg.width;
        const targetHeight = imageHeight ? parseInt(imageHeight) : originalImg.height;

        if (imageWidth || imageHeight) {
          const resizeCanvas = document.createElement('canvas');
          const resizeCtx = resizeCanvas.getContext('2d');
          resizeCanvas.width = targetWidth;
          resizeCanvas.height = targetHeight;
          resizeCtx.drawImage(originalImg, 0, 0, targetWidth, targetHeight);
          img = await createImageBitmap(resizeCanvas);
        }
        
        if (direction === 'horizontal') {
          ctx.drawImage(img, currentX, 0, targetWidth, targetHeight);
          css += `.${classPrefix}-${fileName} {
  width: ${targetWidth}px;
  height: ${targetHeight}px;
  background-position: -${currentX}px 0;
}
`;
          currentX += targetWidth + spacing;
        } else if (direction === 'vertical') {
          ctx.drawImage(img, 0, currentY, targetWidth, targetHeight);
          css += `.${classPrefix}-${fileName} {
  width: ${targetWidth}px;
  height: ${targetHeight}px;
  background-position: 0 -${currentY}px;
}
`;
          currentY += targetHeight + spacing;
        } else if (direction === 'diagonal') {
          const row = Math.floor(i / numCols);
          const col = i % numCols;
          currentX = col * (targetWidth + spacing);
          currentY = row * (targetHeight + spacing);
          
          ctx.drawImage(img, currentX, currentY, targetWidth, targetHeight);
          css += `.${classPrefix}-${fileName} {
  width: ${targetWidth}px;
  height: ${targetHeight}px;
  background-position: -${currentX}px -${currentY}px;
}
`;
        }
      }

      // Convert canvas to blob and create URL
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        setSpriteUrl(url);
        setCssCode(css);
      });
    } catch (error) {
      console.error('Error generating sprite:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSprite = () => {
    if (spriteUrl) {
      fetch(spriteUrl)
        .then(res => res.blob())
        .then(blob => saveAs(blob, 'sprite.png'));
    }
  };

  const downloadCSS = () => {
    if (cssCode) {
      const blob = new Blob([cssCode], { type: 'text/css' });
      saveAs(blob, 'sprite.css');
    }
  };

  // Update the Box component's styles in the return statement
  return (
    <Box sx={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: { xs: 2, sm: 4 },
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      gap: { xs: 2, md: 4 },
      bgcolor: 'background.default',
      color: 'text.primary',
      minHeight: '100vh'
    }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          color: '#1a237e', 
          fontWeight: 700, 
          textAlign: 'center', 
          mb: 5,
          fontSize: { xs: '1.75rem', sm: '2.125rem' },
          gridColumn: { xs: '1', md: '1 / -1' }
        }}
      >
        CSS Sprite Generator
      </Typography>
  
      {/* Left Column - Image Uploader */}
      <StyledPaper elevation={3}>
        <Typography variant="h6" sx={{ mb: 2, color: '#1a237e' }}>
          Upload Images
        </Typography>
        <DropzoneContainer {...getRootProps()} style={{ opacity: isGenerating ? 0.6 : 1 }}>
          <input {...getInputProps()} disabled={isGenerating} />
          {isDragActive ? (
            <Typography variant="h6" color="primary">
              Drop the images here ...
            </Typography>
          ) : (
            <Typography variant="h6" color="textSecondary">
              Drag 'n' drop images here, or click to select files
            </Typography>
          )}
        </DropzoneContainer>
  
        {images.length > 0 && (
          <PreviewContainer>
            {images.map((file, index) => (
              <PreviewImage
                key={file.name}
                src={file.preview}
                alt={`Preview ${index + 1}`}
              />
            ))}
          </PreviewContainer>
        )}
      </StyledPaper>
  
      {/* Right Column - Generator Options and Results */}
      <StyledPaper elevation={3}>
        <Typography variant="h6" sx={{ mb: 2, color: '#1a237e' }}>
          Generator Options
        </Typography>
        {images.length > 0 ? (
          <>
            <Stack spacing={3} sx={{ mb: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Layout Direction</InputLabel>
                <Select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value)}
                  label="Layout Direction"
                  disabled={isGenerating}
                >
                  <MenuItem value="horizontal">Horizontal</MenuItem>
                  <MenuItem value="vertical">Vertical</MenuItem>
                  <MenuItem value="diagonal">Diagonal</MenuItem>
                </Select>
              </FormControl>
  
              <TextField
                fullWidth
                type="number"
                label="Spacing (px)"
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
                disabled={isGenerating}
                InputProps={{ inputProps: { min: 0 } }}
              />
  
              <TextField
                fullWidth
                label="Class Prefix"
                value={classPrefix}
                onChange={(e) => setClassPrefix(e.target.value)}
                disabled={isGenerating}
              />
  
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Image Width (px)"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value)}
                  disabled={isGenerating}
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Leave empty to keep original size"
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Image Height (px)"
                  value={imageHeight}
                  onChange={(e) => setImageHeight(e.target.value)}
                  disabled={isGenerating}
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Leave empty to keep original size"
                />
              </Stack>
              <Button
                variant="contained"
                onClick={generateSprite}
                disabled={isGenerating}
                sx={{
                  bgcolor: '#3f51b5',
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    bgcolor: '#1a237e',
                    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {isGenerating ? 'Generating...' : 'Generate Sprite'}
              </Button>
            </Stack>
  
            {spriteUrl && cssCode && (
              <ResultContainer>
                <Typography variant="h6" sx={{ mb: 2, color: '#1a237e' }}>
                  Generated Sprite
                </Typography>
                <Box sx={{ mb: 4, textAlign: 'center' }}>
                  <img
                    src={spriteUrl}
                    alt="Generated Sprite"
                    style={{ maxWidth: '100%', height: 'auto', border: '1px solid #e0e0e0', borderRadius: 4 }}
                  />
                </Box>
  
                <Typography variant="h6" sx={{ mb: 2, color: '#1a237e' }}>
                  CSS Code
                </Typography>
                <CodeBlock>{cssCode}</CodeBlock>
  
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    onClick={downloadSprite}
                    sx={{ flex: 1, bgcolor: '#3f51b5', '&:hover': { bgcolor: '#1a237e' } }}
                  >
                    Download Sprite
                  </Button>
                  <Button
                    variant="contained"
                    onClick={downloadCSS}
                    sx={{ flex: 1, bgcolor: '#3f51b5', '&:hover': { bgcolor: '#1a237e' } }}
                  >
                    Download CSS
                  </Button>
                </Stack>
              </ResultContainer>
            )}
          </>
        ) : (
          <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
            Please upload images to start generating sprites
          </Typography>
        )}
      </StyledPaper>
    </Box>
  );
}

export default App;
