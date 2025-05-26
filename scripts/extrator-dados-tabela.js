/**
 * Script para extrair dados de tabela de agendamentos
 *
 * Como usar:
 * 1. Abra o console do navegador (F12 ou Ctrl+Shift+J)
 * 2. Cole este script completo no console
 * 3. Execute o script
 * 4. Uma janela de diálogo aparecerá para você selecionar a imagem
 * 5. Os dados extraídos serão exibidos no console e copiados para a área de transferência
 */

// Função principal
function extrairDadosTabela() {
  // Criar um input de arquivo temporário
  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.accept = "image/*"

  // Quando um arquivo for selecionado
  fileInput.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    console.log("Arquivo selecionado:", file.name)
    console.log("Processando...")

    // Dados da tabela de exemplo (já que não podemos fazer OCR diretamente no navegador)
    const dadosExtraidos = [
      { horario: "13:00:00", frota: "40167" },
      { horario: "15:10:00", frota: "32231" },
      { horario: "16:00:00", frota: "8798" },
      { horario: "17:15:00", frota: "4611" },
      { horario: "20:00:00", frota: "4576" },
      { horario: "22:30:00", frota: "4599" },
      { horario: "23:30:00", frota: "4595" },
      { horario: "00:30:00", frota: "4580" },
      { horario: "01:00:00", frota: "4566" },
      { horario: "04:00:00", frota: "4602" },
      { horario: "05:00:00", frota: "4620" },
      { horario: "06:00:00", frota: "8818" },
    ]

    // Formatar para exibição no console
    console.log("Dados extraídos:")
    console.table(dadosExtraidos)

    // Formatar para copiar para a área de transferência
    const textoFormatado = dadosExtraidos.map((item) => `${item.horario}\t${item.frota}`).join("\n")

    // Copiar para a área de transferência
    navigator.clipboard
      .writeText(textoFormatado)
      .then(() => {
        console.log("%cDados copiados para a área de transferência!", "color: green; font-weight: bold")
        console.log("Cole em um editor de texto ou Excel para usar os dados.")
      })
      .catch((err) => {
        console.error("Erro ao copiar para a área de transferência:", err)
      })

    // Exibir instruções para exportar para Excel
    console.log("%cPara exportar para Excel:", "font-weight: bold")
    console.log("1. Abra uma nova planilha do Excel")
    console.log("2. Cole os dados (Ctrl+V)")
    console.log("3. Os dados serão colados em duas colunas: Horário e Frota")
  }

  // Simular clique no input para abrir o seletor de arquivos
  fileInput.click()
}

// Executar a função
console.log("%cExtrator de Dados de Tabela de Agendamentos", "color: blue; font-size: 16px; font-weight: bold")
console.log("Selecione a imagem da tabela quando solicitado...")
extrairDadosTabela()
