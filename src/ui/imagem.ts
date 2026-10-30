import { ErroDeDominio } from '../dominio/ErroDeDominio';

const LARGURA_MAXIMA = 480;
const QUALIDADE_JPEG = 0.8;

/**
 * Reduz a foto no próprio navegador antes de guardar: uma foto de celular (vários MB) vira
 * um JPEG de ~40 KB, que cabe com folga no armazenamento do navegador.
 */
export async function reduzirImagem(arquivo: File): Promise<string> {
  if (!arquivo.type.startsWith('image/')) throw new ErroDeDominio('Escolha um arquivo de imagem (JPG ou PNG).');
  const endereco = URL.createObjectURL(arquivo);
  try {
    const imagem = await carregar(endereco);
    const escala = Math.min(1, LARGURA_MAXIMA / imagem.naturalWidth);
    const tela = document.createElement('canvas');
    tela.width = Math.round(imagem.naturalWidth * escala);
    tela.height = Math.round(imagem.naturalHeight * escala);
    tela.getContext('2d')?.drawImage(imagem, 0, 0, tela.width, tela.height);
    return tela.toDataURL('image/jpeg', QUALIDADE_JPEG);
  } finally {
    URL.revokeObjectURL(endereco);
  }
}

function carregar(endereco: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rejeitar) => {
    const imagem = new Image();
    imagem.onload = () => resolver(imagem);
    imagem.onerror = () => rejeitar(new ErroDeDominio('Não foi possível abrir essa imagem.'));
    imagem.src = endereco;
  });
}
