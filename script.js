// Configurações
const NOTES_PER_PAGE = 10;
let currentPage = 1;
let notas = [];
let filteredNotas = [];
let currentSort = { column: null, direction: 'asc' };
let taxesChart = null;
let statusChart = null;
let apuracaoChart = null;

// Funções de alerta personalizadas usando SweetAlert2
const showAlert = {
    success: (message, timer = 3000) => {
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: message,
            timer: timer,
            confirmButtonColor: '#2a5bd7'
        });
    },
    error: (message, title = 'Erro!') => {
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonColor: '#2a5bd7'
        });
    },
    info: (message, title = 'Informação') => {
        Swal.fire({
            icon: 'info',
            title: title,
            text: message,
            confirmButtonColor: '#2a5bd7'
        });
    },
    warning: (message, title = 'Atenção!') => {
        Swal.fire({
            icon: 'warning',
            title: title,
            text: message,
            confirmButtonColor: '#2a5bd7'
        });
    },
    confirm: (message, title = 'Confirmar', callback) => {
        Swal.fire({
            icon: 'question',
            title: title,
            text: message,
            showCancelButton: true,
            confirmButtonText: 'Sim',
            cancelButtonText: 'Não',
            confirmButtonColor: '#2a5bd7',
            cancelButtonColor: '#6c757d'
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    },
    loading: (message = 'Processando...') => {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    },
    close: () => {
        Swal.close();
    }
};

// Elementos DOM
const elements = {
    xmlInput: document.getElementById("xmlInput"),
    numeroFilter: document.getElementById("numeroFilter"),
    statusFilter: document.getElementById("statusFilter"),
    exportExcel: document.getElementById("exportExcel"),
    exportPDF: document.getElementById("exportPDF"),
    notasTable: document.getElementById("notasTable"),
    empresaNome: document.getElementById("empresaNome"),
    competencia: document.getElementById("competencia"),
    dropzone: document.getElementById("dropzone"),
    prevPage: document.getElementById("prevPage"),
    nextPage: document.getElementById("nextPage"),
    pageInfo: document.getElementById("pageInfo"),
    pagination: document.getElementById("pagination"),
    noteDetail: document.getElementById("noteDetail"),
    noteDetailContent: document.getElementById("noteDetailContent"),
    closeDetail: document.getElementById("closeDetail"),
    warningModal: document.getElementById("warningModal"),
    loadingModal: document.getElementById("loadingModal"),
    exportModal: document.getElementById("exportModal"),
    closeModal: document.getElementById("closeModal"),
    understandBtn: document.getElementById("understandBtn"),
    closeExportModal: document.getElementById("closeExportModal"),
    cancelExport: document.getElementById("cancelExport"),
    confirmExportPDF: document.getElementById("confirmExportPDF"),
    exportDashboard: document.getElementById("exportDashboard"),
    exportTable: document.getElementById("exportTable"),
    dashboard: document.getElementById("dashboard"),
    columnsModal: document.getElementById("columnsModal"),
    closeColumnsModal: document.getElementById("closeColumnsModal"),
    cancelColumns: document.getElementById("cancelColumns"),
    confirmExportExcel: document.getElementById("confirmExportExcel"),
    columnsOptions: document.getElementById("columnsOptions")
};

// Mapeamento de colunas para exportação
const columnMapping = {
    'numero': 'Número',
    'dataEmissao': 'Data',
    'razaoSocial': 'Tomador',
    'cnpj': 'CNPJ/CPF',
    'valorNota': 'Valor Total',
    'iss': 'ISS',
    'issRetido': 'ISS Retido',
    'ir': 'IR',
    'pis': 'PIS',
    'cofins': 'COFINS',
    'csll': 'CSLL',
    'inss': 'INSS',
    'status': 'Status'
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar aviso com SweetAlert2 em vez do modal tradicional
    Swal.fire({
        title: 'Aviso Importante',
        icon: 'warning',
        html: `
            <p class="mb-[20px] text-left">O Leitor de XML de NFSe atualmente tem suporte completo apenas para a prefeitura de <strong>Porto Velho</strong>.</p>
            
            <p class="mb-[10px] text-left">Estamos em fase de testes com os leiautes das seguintes prefeituras:</p>
            <ul class="mb-[20px] pl-[20px] text-left">
                <li class="mb-[5px]"><strong>Ariquemes</strong></li>
                <li class="mb-[5px]"><strong>Ouro Preto do Oeste</strong></li>
            </ul>
            
            <p class="text-left">Se você estiver usando notas fiscais de outras prefeituras, pode ocorrer incompatibilidade na leitura dos dados.</p>
        `,
        confirmButtonText: 'Entendi',
        confirmButtonColor: '#2a5bd7',
        width: '500px'
    });
    
    // Configurar eventos
    setupEventListeners();
    
    // Inicializar gráficos vazios
    updateDashboard([]);
});


function setupEventListeners() {
  // Upload
  elements.xmlInput.addEventListener("change", handleFiles);

  // Filtros simples
  elements.statusFilter.addEventListener("change", filterNotas);
  elements.numeroFilter.addEventListener("input", filterNotas);

  // Exportações
  elements.exportExcel.addEventListener("click", showColumnsModal);
  elements.exportPDF.addEventListener("click", showExportModal);
  elements.confirmExportPDF.addEventListener("click", exportToPDF);

  // Paginação
  elements.prevPage.addEventListener("click", goToPrevPage);
  elements.nextPage.addEventListener("click", goToNextPage);

  // Modais
  elements.closeModal.addEventListener("click", () => elements.warningModal.classList.add('hidden'));
  elements.understandBtn.addEventListener("click", () => elements.warningModal.classList.add('hidden'));
  elements.closeExportModal.addEventListener("click", () => elements.exportModal.classList.add('hidden'));
  elements.cancelExport.addEventListener("click", () => elements.exportModal.classList.add('hidden'));
  elements.closeDetail.addEventListener("click", () => elements.noteDetail.classList.add('hidden'));

  // Dropzone
  elements.dropzone.addEventListener("click", () => elements.xmlInput.click());
  elements.dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    elements.dropzone.classList.add("active");
  });
  elements.dropzone.addEventListener("dragleave", () => elements.dropzone.classList.remove("active"));
  elements.dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    elements.dropzone.classList.remove("active");
    elements.xmlInput.files = e.dataTransfer.files;
    handleFiles({ target: elements.xmlInput });
  });

  // Ordenação de colunas
  document.querySelectorAll('.sortable').forEach(header => {
    header.addEventListener('click', () => {
      const column = header.getAttribute('data-sort');
      sortTable(column);
    });
  });

  // Modal de colunas Excel
  elements.closeColumnsModal.addEventListener("click", () => elements.columnsModal.classList.add('hidden'));
  elements.cancelColumns.addEventListener("click", () => elements.columnsModal.classList.add('hidden'));
  elements.confirmExportExcel.addEventListener("click", () => {
    elements.columnsModal.classList.add('hidden');
    exportToExcelConfirmed();
  });

  // Tecla ESC fecha modais
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      [elements.warningModal, elements.exportModal, elements.noteDetail, elements.columnsModal].forEach(modal => {
        if (!modal.classList.contains("hidden")) {
          modal.classList.add("hidden");
        }
      });
    }
  });

  // Botão para adicionar filtros compostos
  const addBtn = document.getElementById('addFilterBtn');
  if (addBtn) {
    addBtn.addEventListener('click', addFilterCondition);
  }

  // Botão para limpar todos os filtros
  const clearBtn = document.getElementById('clearFiltersBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearAllFilters);
  }

  // Filtro avançado individual (antigo - ainda funcional como "filtro rápido")
  ['change', 'input'].forEach(evt => {
    ['advancedColumn', 'advancedOperator', 'advancedValue1', 'advancedValue2'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener(evt, applyAdvancedFilter);
    });
  });

  // Mostrar ou ocultar campo 2 no filtro rápido
  const quickOperator = document.getElementById('advancedOperator');
  if (quickOperator) {
    quickOperator.addEventListener('change', e => {
      const op = e.target.value;
      const val2 = document.getElementById('advancedValue2');
      if (val2) {
        val2.classList.toggle('hidden', op !== 'between');
      }
    });
  }
  
//Gráfico de Apuração
  const apuracaoBtn = document.getElementById('apuracaoBtn');
    if (apuracaoBtn) {
        apuracaoBtn.addEventListener("click", toggleApuramento);
        console.log('Event listener adicionado ao botão Apurar'); // Debug
    } else {
        console.error('Botão Apurar não encontrado');
    }
  
}



function showColumnsModal() {
    if (notas.length === 0) {
        showAlert.warning("Nenhuma nota para exportar. Por favor, importe arquivos XML primeiro.");
        return;
    }
    
    // Limpa opções anteriores
    elements.columnsOptions.innerHTML = '';
    
    // Adiciona um toggle switch para cada coluna
    Object.entries(columnMapping).forEach(([key, label]) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'flex items-center justify-between bg-light-gray px-4 py-2 rounded-md';
        
        optionDiv.innerHTML = `
            <span class="text-sm select-none">${label}</span>
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" data-column="${key}" class="sr-only peer" checked>
                <div class="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-dark transition-all"></div>
                <div class="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-5"></div>
            </label>
        `;
        
        elements.columnsOptions.appendChild(optionDiv);
    });
    
    elements.columnsModal.classList.remove('hidden');
    elements.columnsModal.classList.add('flex');
    
    setTimeout(() => {
  elements.columnsModal.querySelector('input[type="checkbox"]')?.focus();
}, 100);

}

function getSelectedColumns() {
    const selectedColumns = {};
    document.querySelectorAll('#columnsOptions input[type="checkbox"]').forEach(checkbox => {
        const columnKey = checkbox.getAttribute('data-column');
        selectedColumns[columnKey] = checkbox.checked;
    });
    return selectedColumns;
}

function exportToExcelConfirmed() {
    if (notas.length === 0) return;
    
    try {
        showAlert.loading("Gerando arquivo Excel...");
        
        if (typeof XLSX === 'undefined') {
            showAlert.info("Biblioteca para exportação Excel ainda não carregada. Por favor, tente novamente em alguns segundos.");
            return;
        }
        
        const selectedColumns = getSelectedColumns();
        
        // Filtra as colunas que devem ser exportadas
        const dataToExport = filteredNotas.map(nota => {
            const row = {};
            
            if (selectedColumns.numero) row['Número'] = nota.numero;
            if (selectedColumns.dataEmissao) row['Data'] = formatDate(nota.dataEmissao);
            if (selectedColumns.razaoSocial) row['Tomador'] = nota.razaoSocial;
            if (selectedColumns.cnpj) row['CNPJ/CPF'] = formatCNPJ(nota.cnpj);
            if (selectedColumns.valorNota) row['Valor Total'] = formatMoney(nota.valorNota);
            if (selectedColumns.iss) row['ISS'] = formatMoney(nota.iss);
            if (selectedColumns.issRetido) row['ISS Retido'] = formatMoney(nota.issRetido);
            if (selectedColumns.ir) row['IR'] = formatMoney(nota.ir);
            if (selectedColumns.pis) row['PIS'] = formatMoney(nota.pis);
            if (selectedColumns.cofins) row['COFINS'] = formatMoney(nota.cofins);
            if (selectedColumns.csll) row['CSLL'] = formatMoney(nota.csll);
            if (selectedColumns.inss) row['INSS'] = formatMoney(nota.inss);
            if (selectedColumns.status) row['Status'] = nota.status === "1" ? "Normal" : "Cancelada";
            
            return row;
        });
        
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Notas Fiscais");
        
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const fileName = `notas-fiscais-${elements.empresaNome.textContent.replace(/\s+/g, '-')}-${dateStr}.xlsx`;
        
        XLSX.writeFile(workbook, fileName);
        
        showAlert.close();
        showAlert.success(`Arquivo Excel exportado com sucesso! (${filteredNotas.length} notas)`);
    } catch (error) {
        console.error("Erro ao exportar para Excel:", error);
        showAlert.error("Ocorreu um erro ao exportar para Excel. Verifique o console para mais detalhes.");
    }
}

function showExportModal() {
    if (notas.length === 0) {
        showAlert.warning("Nenhuma nota para exportar. Por favor, importe arquivos XML primeiro.");
        return;
    }
    elements.exportModal.classList.remove('hidden');
    elements.exportModal.classList.add('flex');

    // Foca no botão "Exportar PDF"
    setTimeout(() => {
    document.getElementById("confirmExportPDF")?.focus();
    }, 100);

}

function showLoading(show) {
    if (show) {
        showAlert.loading("Processando arquivos...");
    } else {
        showAlert.close();
    }
}

async function handleFiles(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    showLoading(true);
    elements.dropzone.classList.add('hidden');
    
    try {
        notas = [];
        let invalidMunicipioNotes = [];
        
        const readerPromises = Array.from(files).map(file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => {
                    try {
                        const parser = new DOMParser();
                        const xml = parser.parseFromString(e.target.result, "application/xml");
                        
                        // Verificar CodigoMunicipio do TOMADOR
                        const compNfses = xml.getElementsByTagName("CompNfse");
                        for (let comp of compNfses) {
                            const tomador = comp.getElementsByTagName("TomadorServico")[0];
                            if (tomador) {
                                const enderecoTomador = tomador.getElementsByTagName("Endereco")[0];
                                if (enderecoTomador) {
                                    const codigoMunicipio = enderecoTomador.getElementsByTagName("CodigoMunicipio")[0]?.textContent.trim();
                                    if (codigoMunicipio === "0") {
                                        const infNfse = comp.getElementsByTagName("InfNfse")[0];
                                        const numero = infNfse?.getElementsByTagName("Numero")[0]?.textContent.trim();
                                        if (numero) invalidMunicipioNotes.push(numero);
                                    }
                                }
                            }
                        }
                        
                        const notasArquivo = parseLote(xml);
                        notas.push(...notasArquivo);
                        resolve();
                    } catch (error) {
                        console.error("Erro ao processar arquivo:", file.name, error);
                        resolve();
                    }
                };
                reader.onerror = () => {
                    console.error("Erro ao ler arquivo:", file.name);
                    resolve();
                };
                reader.readAsText(file);
            });
        });

        await Promise.all(readerPromises);
        
        if (notas.length === 0) {
            showAlert.warning("Nenhuma nota válida encontrada nos arquivos selecionados.");
            return;
        }
        
        // Ordenar por data de emissão por padrão
        sortTable('dataEmissao', 'desc');
        
        // Atualizar interface
        filterNotas();
        
        // Mostrar mensagem de sucesso
        showAlert.success(`${notas.length} notas fiscais carregadas com sucesso!`);
        
        // Mostrar alerta de município inválido APÓS o alerta de sucesso
        if (invalidMunicipioNotes.length > 0) {
            setTimeout(() => {
                Swal.fire({
                    title: 'Atenção: Município Inválido',
                    html: `As notas de número ${invalidMunicipioNotes.join(', ')} estão com município do tomador inválido (Código=0)!`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Corrigir Município',
                    cancelButtonText: 'Cancelar',
                    showDenyButton: true,
                    denyButtonText: 'Exportar XML Corrigido',
                    confirmButtonColor: '#4caf50',
                    denyButtonColor: '#2a5bd7',
                    cancelButtonColor: '#6c757d'
                }).then((result) => {
                    if (result.isConfirmed) {
                        corrigirMunicipios(invalidMunicipioNotes);
                        showAlert.success('Municípios corrigidos com sucesso!');
                    } else if (result.isDenied) {
                        exportarXmlCorrigido(invalidMunicipioNotes);
                    }
                });
            }, 1000);
        }
        
    } catch (error) {
        console.error("Erro ao processar arquivos:", error);
        showAlert.error("Ocorreu um erro ao processar os arquivos. Verifique o console para mais detalhes.");
    } finally {
        showLoading(false);
    }
}

function parseLote(xml) {
  const lista = [];
  const compNfses = xml.getElementsByTagName("CompNfse");
  let nomePrestador = '';

  for (let comp of compNfses) {
    try {
      const inf = comp.getElementsByTagName("InfNfse")[0];
      const servico = comp.getElementsByTagName("Servico")[0];
      const valoresServico = servico?.getElementsByTagName("Valores")[0];
      const valoresNfse = comp.getElementsByTagName("ValoresNfse")[0];
      const tomador = comp.getElementsByTagName("TomadorServico")[0];
      const prestador = comp.getElementsByTagName("PrestadorServico")[0];

      const get = (parent, tag) =>
        parent?.getElementsByTagName(tag)[0]?.textContent.trim() || "";

      // ➕ Nome do prestador (empresa)
      if (!nomePrestador && prestador) {
        nomePrestador = get(prestador, "RazaoSocial");
        elements.empresaNome.textContent = nomePrestador || 'a empresa';
      }

      const numero = get(inf, "Numero");
      const dataEmissao = get(inf, "DataEmissao");
      const status = get(inf, "Status") || "1";

      const razaoSocial = get(tomador, "RazaoSocial");
      const cnpj = get(tomador, "Cnpj") || get(tomador, "Cpf") || "";

      // ➕ Dados do município do tomador
      const enderecoTomador = tomador?.getElementsByTagName("Endereco")[0];
      const codigoMunicipioTomador = get(enderecoTomador, "CodigoMunicipio");
      const municipioTomador = get(enderecoTomador, "Municipio");
      const ufTomador = get(enderecoTomador, "Uf");
      const municipioFormatado = formatMunicipio(codigoMunicipioTomador, municipioTomador, ufTomador);

      // 🔢 Valores principais
      const valorNota = parseFloat(
        get(valoresNfse, "BaseCalculo") || get(valoresServico, "ValorServicos") || "0"
      );

      const valorIss = parseFloat(
        get(valoresNfse, "ValorIss") || get(valoresServico, "ValorIss") || "0"
      );

      const ir = parseFloat(get(valoresServico, "ValorIr")) || 0;
      const pis = parseFloat(get(valoresServico, "ValorPis")) || 0;
      const cofins = parseFloat(get(valoresServico, "ValorCofins")) || 0;
      const csll = parseFloat(get(valoresServico, "ValorCsll")) || 0;
      const inss = parseFloat(get(valoresServico, "ValorInss")) || 0;

      // 🔍 ISS e ISS Retido
      const issRetidoTag = get(servico, "IssRetido");
      const issRetido = issRetidoTag === "1" ? valorIss : 0;
      const issNormal = issRetidoTag === "2" ? valorIss : 0;

      // ➕ CSRF consolidado
      const csrf = pis + cofins + csll;

      // 🔗 Serialização do XML da nota individual
      const xmlString = new XMLSerializer().serializeToString(comp);

      // ✅ Monta objeto nota
      const nota = {
        numero,
        dataEmissao,
        status,
        valorNota,
        iss: issNormal,
        issRetido,
        ir,
        pis,
        cofins,
        csll,
        csrf,
        inss,
        razaoSocial,
        cnpj,
        municipioTomador: municipioFormatado,
        xml: xmlString
      };

      lista.push(nota);

    } catch (error) {
      console.warn(`Erro ao processar nota:`, error);
    }
  }

  return lista;
}



// Função auxiliar para formatar a informação do município
function formatMunicipio(codigo, nome, uf) {
    if (!codigo || codigo === '0') return 'Município inválido (Código=0)';
    
    const parts = [];
    if (nome) parts.push(nome);
    if (codigo) parts.push(`(${codigo})`);
    if (uf) parts.push(uf);
    
    return parts.join(' ').trim();
}

function displayNotas(data) {
  const tbody = elements.notasTable.querySelector("tbody");
  tbody.innerHTML = "";

  if (data.length === 0) {
    tbody.innerHTML = `
      <tr class="text-center p-[40px] text-gray">
        <td colspan="14">
          <i class="fas fa-search text-[3rem] mb-[20px] opacity-50"></i>
          <p class="mb-[10px]">Nenhuma nota encontrada com os filtros atuais</p>
        </td>
      </tr>
    `;
    elements.pagination.classList.add('hidden');
    return;
  }

  // Calcular paginação
  const totalPages = Math.ceil(data.length / NOTES_PER_PAGE);
  const startIndex = (currentPage - 1) * NOTES_PER_PAGE;
  const endIndex = Math.min(startIndex + NOTES_PER_PAGE, data.length);
  const paginatedData = data.slice(startIndex, endIndex);

  // Atualizar paginação
  elements.prevPage.disabled = currentPage <= 1;
  elements.nextPage.disabled = currentPage >= totalPages;
  elements.pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
  elements.pagination.classList.remove('hidden');

  // Renderizar tabela
  paginatedData.forEach(nota => {
    const tr = document.createElement("tr");

    tr.className = `
      hover:bg-primary hover:bg-opacity-5 transition-colors duration-200
      border-l-[4px] border-transparent
      focus-within:outline-none
    `;

    // Realce visual opcional se filtros estiverem ativos
    if (document.getElementById('activeFiltersSummary')?.textContent.trim()) {
      tr.classList.add('border-primary-light', 'bg-primary-light/10');
    }

    tr.innerHTML = `
      <td class="border border-light-gray p-[12px] text-center">${nota.numero}</td>
      <td class="border border-light-gray p-[12px] text-center">${formatDate(nota.dataEmissao)}</td>
      <td class="border border-light-gray p-[12px] text-center">${nota.razaoSocial}</td>
      <td class="border border-light-gray p-[12px] text-center">${formatCNPJ(nota.cnpj)}</td>
      <td class="border border-light-gray p-[12px] text-center">R$ ${formatMoney(nota.valorNota)}</td>
      <td class="border border-light-gray p-[12px] text-center">R$ ${formatMoney(nota.iss)}</td>
      <td class="border border-light-gray p-[12px] text-center">R$ ${formatMoney(nota.issRetido)}</td>
      <td class="border border-light-gray p-[12px] text-center">R$ ${formatMoney(nota.ir)}</td>
      <td class="border border-light-gray p-[12px] text-center">R$ ${formatMoney(nota.pis)}</td>
      <td class="border border-light-gray p-[12px] text-center">R$ ${formatMoney(nota.cofins)}</td>
      <td class="border border-light-gray p-[12px] text-center">R$ ${formatMoney(nota.csll)}</td>
      <td class="border border-light-gray p-[12px] text-center">R$ ${formatMoney(nota.inss)}</td>
      <td class="border border-light-gray p-[12px] text-center">${formatStatus(nota.status)}</td>
      <td class="border border-light-gray p-[12px] text-center">
        <button class="text-primary hover:text-primary-dark" onclick="viewNoteDetail('${nota.numero}')" aria-label="Visualizar nota ${nota.numero}">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function viewNoteDetail(numero) {
  const nota = notas.find(n => n.numero === numero);
  if (!nota) {
    showAlert.error("Nota não encontrada.");
    return;
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(nota.xml, "application/xml");
  const serializer = new XMLSerializer();
  const xmlString = serializer.serializeToString(xmlDoc);
  const formattedXml = escapeHTML(xmlString);

  // Construção do conteúdo
  elements.noteDetailContent.innerHTML = `
    <div class="flex justify-end gap-[10px] mb-[20px]">
      <button id="editNoteBtn" class="inline-flex items-center justify-center gap-[5px] px-[20px] py-[10px] bg-primary text-white rounded-[5px] font-semibold hover:bg-primary-dark">
        <i class="fas fa-edit"></i> Editar
      </button>
      <button id="saveNoteBtn" class="hidden inline-flex items-center justify-center gap-[5px] px-[20px] py-[10px] bg-accent text-white rounded-[5px] font-semibold hover:bg-green-700">
        <i class="fas fa-save"></i> Salvar
      </button>
      <button id="cancelEditBtn" class="hidden inline-flex items-center justify-center gap-[5px] px-[20px] py-[10px] bg-danger text-white rounded-[5px] font-semibold hover:bg-red-700">
        <i class="fas fa-times"></i> Cancelar
      </button>
      <button id="exportXmlBtn" class="inline-flex items-center justify-center gap-[5px] px-[20px] py-[10px] bg-info text-white rounded-[5px] font-semibold hover:bg-blue-700">
        <i class="fas fa-file-export"></i> Exportar XML
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[40px]">
      <div>
        <h3 class="text-primary mb-[10px] text-lg font-semibold">Informações da Nota</h3>
        <p class="mb-2"><strong>Número:</strong> <span id="noteNumero" class="editable-field">${nota.numero}</span></p>
        <p class="mb-2"><strong>Data Emissão:</strong> <span id="noteDataEmissao" class="editable-field">${formatDate(nota.dataEmissao)}</span></p>
        <p class="mb-2"><strong>Status:</strong> <span id="noteStatus" class="editable-field">${formatStatus(nota.status)}</span></p>
        <p class="mb-2"><strong>Valor:</strong> <span id="noteValor" class="editable-field">R$ ${formatMoney(nota.valorNota)}</span></p>
      </div>

      <div>
        <h3 class="text-primary mb-[10px] text-lg font-semibold">Tomador</h3>
        <p class="mb-2"><strong>Nome:</strong> <span id="tomadorNome" class="editable-field">${nota.razaoSocial || "Não informado"}</span></p>
        <p class="mb-2"><strong>CNPJ/CPF:</strong> <span id="tomadorCnpj" class="editable-field">${formatCNPJ(nota.cnpj) || "Não informado"}</span></p>
        <p class="mb-2"><strong>Município:</strong> <span id="tomadorMunicipio" class="editable-field">${nota.municipioTomador || "Não informado"}</span></p>
      </div>
    </div>

    <div>
      <h3 class="text-primary mb-[10px] text-lg font-semibold">Impostos Retidos</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-[20px] mb-[20px]">
        ${renderTaxCard("ISS", "taxIss", nota.iss)}
        ${renderTaxCard("ISS Retido", "taxIssRetido", nota.issRetido)}
        ${renderTaxCard("IR", "taxIr", nota.ir)}
        ${renderTaxCard("PIS", "taxPis", nota.pis)}
        ${renderTaxCard("COFINS", "taxCofins", nota.cofins)}
        ${renderTaxCard("CSLL", "taxCsll", nota.csll)}
        ${renderTaxCard("INSS", "taxInss", nota.inss)}
        ${renderTaxCard("CSRF", "taxCsrf", nota.csrf || (nota.pis + nota.cofins + nota.csll))}
      </div>
    </div>

    <div>
      <h3 class="text-primary mb-[10px] text-lg font-semibold">Apuração - Lucro Presumido</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-[20px] mb-[20px]">
        ${renderTaxCard("PIS", "calcPis", 0)}
        ${renderTaxCard("COFINS", "calcCofins", 0)}
        ${renderTaxCard("IRPJ", "calcIrpj", 0)}
        ${renderTaxCard("CSLL", "calcCsll", 0)}
      </div>
    </div>

    <div>
      <h3 class="text-primary mb-[10px] text-lg font-semibold">XML</h3>
      <pre class="bg-light-gray p-[10px] rounded-[10px] overflow-x-auto max-h-[300px]">${formattedXml}</pre>
    </div>
  `;

  // ⬇️ Atualiza os valores dos impostos e cálculos imediatamente
  updateCalculations(nota);

  // ⬇️ Mostra o modal de detalhes
  elements.noteDetail.classList.remove("hidden");

  // ⬇️ Atribui eventos aos botões
  document.getElementById("editNoteBtn").addEventListener("click", enableNoteEditing);
  document.getElementById("saveNoteBtn").addEventListener("click", () => saveNoteChanges(nota));
  document.getElementById("cancelEditBtn").addEventListener("click", cancelNoteEditing);
  document.getElementById("exportXmlBtn").addEventListener("click", () => exportNoteXml(nota));

  // Foco no botão de editar
  setTimeout(() => {
    document.getElementById("editNoteBtn")?.focus();
  }, 100);
}


function enableNoteEditing() {
  const editBtn = document.getElementById('editNoteBtn');
  const saveBtn = document.getElementById('saveNoteBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const exportBtn = document.getElementById('exportXmlBtn');

  // Gerenciar visibilidade dos botões
  editBtn.classList.add('hidden');
  saveBtn.classList.remove('hidden');
  cancelBtn.classList.remove('hidden');

  // Aplica estilo de botão vermelho para Cancelar
  cancelBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600', 'focus:ring-gray-500');
  cancelBtn.classList.add('bg-red-600', 'hover:bg-red-700', 'focus:ring-red-500');

  cancelBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  cancelBtn.disabled = false;

  // Desativa o botão Exportar XML
  exportBtn.classList.add('opacity-50', 'cursor-not-allowed');
  exportBtn.disabled = true;

  // Transforma os campos em editáveis
  const editableFields = document.querySelectorAll('.editable-field');
  editableFields.forEach(field => {
    const originalValue = field.textContent.trim();
    const value = originalValue.replace(/^R\$ /, '').trim();

    let input;
    if (field.id === 'noteStatus') {
        input = document.createElement('select');
        input.className = 'border border-light-gray p-1 rounded w-full max-w-[200px] focus:ring-2 focus:ring-primary focus:border-transparent';
        input.dataset.originalId = field.id;

  const options = ['Normal', 'Cancelada'];
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt;
    if (originalValue.toLowerCase().includes(opt.toLowerCase())) {
      option.selected = true;
    }
    input.appendChild(option);
  });
} else {
  input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.setAttribute('data-original-value', originalValue);
  input.dataset.originalId = field.id;
  input.className = 'border border-light-gray p-1 rounded w-full max-w-[200px] focus:ring-2 focus:ring-primary focus:border-transparent';
}


    input.setAttribute('data-original-value', originalValue); // Salva o valor original
    input.dataset.originalId = field.id;

    input.className = 'border border-light-gray p-1 rounded w-full max-w-[200px] focus:ring-2 focus:ring-primary focus:border-transparent';

    // Substitui o span pelo input
    field.parentNode.replaceChild(input, field);

    // Foca no input automaticamente
    input.focus();
  });
}

function parseMoney(value) {
  return parseFloat(value.replace(/\./g, '').replace(',', '.').replace('R$', '').trim()) || 0;
}

function parseMoney(value) {
  return parseFloat(value.replace(/\./g, '').replace(',', '.').replace('R$', '').trim()) || 0;
}

function saveNoteChanges(nota) {
  // Mostra o botão Editar e esconde o Salvar
  document.getElementById('editNoteBtn').classList.remove('hidden');
  document.getElementById('saveNoteBtn').classList.add('hidden');
  document.getElementById('cancelEditBtn').classList.add('hidden');
  document.getElementById('exportXmlBtn').classList.remove('opacity-50', 'cursor-not-allowed');
  document.getElementById('exportXmlBtn').disabled = false;

  const inputs = document.querySelectorAll('#noteDetailContent input, #noteDetailContent select');
  let needRecalculation = false;

  inputs.forEach(input => {
    const value = input.value.trim();
    const originalId = input.dataset.originalId;

    const span = document.createElement('span');
    span.id = originalId;
    span.className = 'editable-field';

    switch(originalId) {
      case 'noteNumero':
        nota.numero = value;
        span.textContent = value;
        break;
      case 'noteDataEmissao':
        nota.dataEmissao = value;
        span.textContent = formatDate(value);
        break;
      case 'noteStatus':
        const statusMap = { 'Normal': '1', 'Cancelada': '2' };
        const selectedText = input.options[input.selectedIndex]?.textContent || 'Normal';
        nota.status = statusMap[selectedText] || '1';
        span.textContent = selectedText;
        span.innerHTML = formatStatus(nota.status);
        break;
      case 'noteValor':
        nota.valorNota = parseMoney(value);
        span.textContent = `R$ ${formatMoney(nota.valorNota)}`;
        needRecalculation = true;
        break;
      case 'tomadorNome':
        nota.razaoSocial = value;
        span.textContent = value || 'Não informado';
        break;
      case 'tomadorCnpj':
        nota.cnpj = value.replace(/\D/g, '');
        span.textContent = formatCNPJ(nota.cnpj) || 'Não informado';
        break;
      case 'tomadorMunicipio':
        span.textContent = value || 'Não informado';
        break;
      case 'taxIss':
        nota.iss = parseMoney(value);
        span.textContent = `R$ ${formatMoney(nota.iss)}`;
        needRecalculation = true;
        break;
      case 'taxIssRetido':
        nota.issRetido = parseMoney(value);
        span.textContent = `R$ ${formatMoney(nota.issRetido)}`;
        needRecalculation = true;
        break;
      case 'taxIr':
        nota.ir = parseMoney(value);
        span.textContent = `R$ ${formatMoney(nota.ir)}`;
        needRecalculation = true;
        break;
      case 'taxPis':
        nota.pis = parseMoney(value);
        span.textContent = `R$ ${formatMoney(nota.pis)}`;
        needRecalculation = true;
        break;
      case 'taxCofins':
        nota.cofins = parseMoney(value);
        span.textContent = `R$ ${formatMoney(nota.cofins)}`;
        needRecalculation = true;
        break;
      case 'taxCsll':
        nota.csll = parseMoney(value);
        span.textContent = `R$ ${formatMoney(nota.csll)}`;
        needRecalculation = true;
        break;
      case 'taxInss':
        nota.inss = parseMoney(value);
        span.textContent = `R$ ${formatMoney(nota.inss)}`;
        needRecalculation = true;
        break;
      default:
        span.textContent = value;
    }

    input.parentNode.replaceChild(span, input);
  });

  if (needRecalculation) {
    updateCalculations(nota);
    filterNotas();
  }

  // Atualiza o XML com os dados alterados
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(nota.xml, "application/xml");

    const getTag = (parent, tag) => parent?.getElementsByTagName(tag)[0];

    const infNfse = xmlDoc.getElementsByTagName("InfNfse")[0];
    const servico = xmlDoc.getElementsByTagName("Servico")[0];
    const valoresServico = servico?.getElementsByTagName("Valores")[0];
    const valoresNfse = xmlDoc.getElementsByTagName("ValoresNfse")[0];
    const tomador = xmlDoc.getElementsByTagName("TomadorServico")[0];
    const enderecoTomador = tomador?.getElementsByTagName("Endereco")[0];

    if (infNfse) {
      const numeroTag = getTag(infNfse, "Numero");
      if (numeroTag) numeroTag.textContent = nota.numero;

      const dataTag = getTag(infNfse, "DataEmissao");
      if (dataTag) dataTag.textContent = new Date(nota.dataEmissao).toISOString();
    }

    if (valoresServico) {
      const setValue = (tagName, val) => {
        const tag = getTag(valoresServico, tagName);
        if (tag) tag.textContent = val.toFixed(2);
      };

      setValue("ValorServicos", nota.valorNota);
      setValue("ValorIss", nota.iss);
      setValue("ValorIr", nota.ir);
      setValue("ValorPis", nota.pis);
      setValue("ValorCofins", nota.cofins);
      setValue("ValorCsll", nota.csll);
      setValue("ValorInss", nota.inss);
    }

    if (valoresNfse) {
      const tagBase = getTag(valoresNfse, "BaseCalculo");
      if (tagBase) tagBase.textContent = nota.valorNota.toFixed(2);
      const tagIss = getTag(valoresNfse, "ValorIss");
      if (tagIss) tagIss.textContent = nota.iss.toFixed(2);
    }

    if (tomador) {
      const nomeTag = getTag(tomador, "RazaoSocial");
      if (nomeTag) nomeTag.textContent = nota.razaoSocial;
      const cnpjTag = getTag(tomador, "Cnpj") || getTag(tomador, "Cpf");
      if (cnpjTag) cnpjTag.textContent = nota.cnpj;
    }

    if (enderecoTomador) {
      const municipioTag = getTag(enderecoTomador, "Municipio");
      if (municipioTag) municipioTag.textContent = nota.municipioTomador;
    }

    nota.xml = new XMLSerializer().serializeToString(xmlDoc);
  } catch (err) {
    console.error("Erro ao atualizar XML com dados editados:", err);
  }

  showAlert.success("Alterações salvas com sucesso!");
}


function updateCalculations(nota) {
  if (!nota) {
    showAlert.error("Nota não encontrada para cálculo.");
    return;
  }

  try {
    // ✅ Calcular CSRF (se não existir já consolidado)
    const valorCsrf = nota.csrf ?? (nota.pis + nota.cofins + nota.csll);

    // ✅ Atualizar quadro de Impostos Retidos
    document.getElementById("taxIss").textContent = `R$ ${formatMoney(nota.iss)}`;
    document.getElementById("taxIssRetido").textContent = `R$ ${formatMoney(nota.issRetido)}`;
    document.getElementById("taxIr").textContent = `R$ ${formatMoney(nota.ir)}`;
    document.getElementById("taxPis").textContent = `R$ ${formatMoney(nota.pis)}`;
    document.getElementById("taxCofins").textContent = `R$ ${formatMoney(nota.cofins)}`;
    document.getElementById("taxCsll").textContent = `R$ ${formatMoney(nota.csll)}`;
    document.getElementById("taxInss").textContent = `R$ ${formatMoney(nota.inss)}`;
    document.getElementById("taxCsrf").textContent = `R$ ${formatMoney(valorCsrf)}`;

    // ===============================
    // 🔢 Cálculo — Lucro Presumido
    // ===============================

    const baseTrimestral = nota.valorNota * 0.32;
    const pisPresumido = (nota.valorNota * 0.65) / 100;
    const cofinsPresumido = (nota.valorNota * 3) / 100;
    const irpjPresumido = baseTrimestral * 0.15;
    const csllPresumido = baseTrimestral * 0.09;

    const pisLiquidado = pisPresumido - (nota.pis || 0);
    const cofinsLiquidado = cofinsPresumido - (nota.cofins || 0);
    const irpjLiquidado = irpjPresumido - (nota.ir || 0);
    const csllLiquidado = csllPresumido - (nota.csll || 0);

    // ✅ Atualizar quadro de Lucro Presumido
    document.getElementById("calcPis").textContent = `R$ ${formatMoney(pisLiquidado)}`;
    document.getElementById("calcCofins").textContent = `R$ ${formatMoney(cofinsLiquidado)}`;
    document.getElementById("calcIrpj").textContent = `R$ ${formatMoney(irpjLiquidado)}`;
    document.getElementById("calcCsll").textContent = `R$ ${formatMoney(csllLiquidado)}`;

  } catch (error) {
    console.error("Erro ao atualizar cálculos:", error);
    showAlert.error("Erro ao atualizar os cálculos. Verifique o console.");
  }
}

function exportNoteXml(nota) {
    try {
        const blob = new Blob([nota.xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nota_${nota.numero}_${new Date().toISOString().slice(0,10)}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert.success('XML exportado com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar XML:', error);
        showAlert.error('Ocorreu um erro ao exportar o XML.');
    }
}

function formatXML(xml) {
    let formatted = '';
    let indent = '';
    const tab = '    ';
    xml.split(/>\s*</).forEach(function(node) {
        if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
        formatted += indent + '<' + node + '>\r\n';
        if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;
    });
    return formatted.substring(1, formatted.length-3);
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updateDashboard(data) {
    // Calcular valores para o dashboard
    const valorTotal = data.reduce((sum, nota) => sum + nota.valorNota, 0);
    const valorImpostos = data.reduce((sum, nota) => 
        sum + nota.iss + nota.issRetido + nota.ir + nota.pis + nota.cofins + nota.csll + nota.inss, 0);
    const notasNormais = data.filter(nota => nota.status !== "2").length;
    const notasCanceladas = data.filter(nota => nota.status === "2").length;
    
    // Atualizar valores no dashboard usando formatação brasileira
    document.getElementById("valor-total").textContent = `R$ ${formatMoney(valorTotal)}`;
    document.getElementById("valor-impostos").textContent = `R$ ${formatMoney(valorImpostos)}`;
    document.getElementById("notas-normais").textContent = notasNormais;
    document.getElementById("notas-canceladas").textContent = notasCanceladas;
    
    // Preparar dados para os gráficos
    const taxesData = {
        labels: ['ISS', 'ISS Retido', 'IR', 'PIS', 'COFINS', 'CSLL', 'INSS'],
        datasets: [{
            label: 'Valor (R$)',
            data: [
                data.reduce((sum, nota) => sum + nota.iss, 0),
                data.reduce((sum, nota) => sum + nota.issRetido, 0),
                data.reduce((sum, nota) => sum + nota.ir, 0),
                data.reduce((sum, nota) => sum + nota.pis, 0),
                data.reduce((sum, nota) => sum + nota.cofins, 0),
                data.reduce((sum, nota) => sum + nota.csll, 0),
                data.reduce((sum, nota) => sum + nota.inss, 0)
            ],
            backgroundColor: [
                '#4caf50', // Verde
                '#2a5bd7', // Azul
                '#ff9800', // Laranja
                '#9c27b0', // Roxo
                '#f44336', // Vermelho
                '#3f51b5', // Azul escuro
                '#607d8b'  // Cinza azulado
            ]
        }]
    };
    
    const statusData = {
        labels: ['Normal', 'Cancelada'],
        datasets: [{
            data: [notasNormais, notasCanceladas],
            backgroundColor: ['#4caf50', '#f44336']
        }]
    };
    
    // Atualizar gráficos
    if (taxesChart) {
        taxesChart.data = taxesData;
        taxesChart.update();
    } else {
        const taxCtx = document.getElementById('taxesChart').getContext('2d');
        taxesChart = new Chart(taxCtx, {
            type: 'bar',
            data: taxesData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Impostos Retidos',
                        color: '#333',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `R$ ${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
    
    if (statusChart) {
        statusChart.data = statusData;
        statusChart.update();
    } else {
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: statusData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Status das Notas',
                        color: '#333',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    if (!document.getElementById('apuracaoChartContainer').classList.contains('hidden')) {
        createApuramentoChart();
    }
}



function filterNotas() {
  const status = elements.statusFilter.value;
  const numero = elements.numeroFilter.value.trim().toLowerCase();

  // Aplica os filtros simples sobre todas as notas
  filteredNotas = notas.filter(nota => {
    let match = true;

    if (status !== 'todos') {
      match = match && nota.status === status;
    }

    if (numero !== '') {
      match = match && nota.numero.toLowerCase().includes(numero);
    }

    return match;
  });

  // Agora aplica os filtros avançados sobre o resultado já filtrado
  applyAdvancedFilter();
  
  // Atualiza a exibição e dashboard
  currentPage = 1;
  displayNotas(filteredNotas);
  updateDashboard(filteredNotas);
}




function sortTable(column, direction) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = direction || 'asc';
    }
    
    filteredNotas.sort((a, b) => {
        let comparison = 0;
        
        // Ordenação específica para cada tipo de coluna
        if (column === 'numero' || column === 'razaoSocial' || column === 'cnpj') {
            comparison = a[column].localeCompare(b[column]);
        } else if (column === 'dataEmissao') {
            const dateA = new Date(a[column]);
            const dateB = new Date(b[column]);
            comparison = dateA - dateB;
        } else {
            comparison = a[column] - b[column];
        }
        
        // Inverter para ordem descendente
        return currentSort.direction === 'asc' ? comparison : -comparison;
    });
    
    // Resetar para a primeira página após ordenação
    currentPage = 1;
    displayNotas(filteredNotas);
    
    // Atualizar indicadores visuais de ordenação
    updateSortIndicators();
}

function updateSortIndicators() {
    document.querySelectorAll('.sortable').forEach(header => {
        const column = header.getAttribute('data-sort');
        const icon = header.querySelector('.sort-icon');
        
        if (column === currentSort.column) {
            icon.className = `fas fa-sort-${currentSort.direction === 'asc' ? 'up' : 'down'} text-primary sort-icon`;
            icon.style.opacity = '1';
        } else {
            icon.className = 'fas fa-sort text-gray-400 sort-icon';
            icon.style.opacity = '0.5';
        }
    });
}

function renderTaxCard(label, id, value) {
    return `
        <div class="bg-white rounded-[10px] p-[15px] shadow-sm border-l-4 border-primary">
            <h4 class="text-sm font-medium text-gray-700 mb-[5px]">${label}</h4>
            <div id="${id}" class="text-lg font-bold">R$ ${formatMoney(value || 0)}</div>
        </div>
    `;
}


function formatDate(dateStr) {
    if (!dateStr) return "-";
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    } catch (e) {
        return dateStr;
    }
}

function formatCNPJ(cnpj) {
    if (!cnpj) return "-";
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length === 11) {
        return cnpj.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (cnpj.length === 14) {
        return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    
    return cnpj;
}

function formatStatus(status) {
    switch (status) {
        case "1": return '<span class="text-accent">Normal</span>';
        case "2": return '<span class="text-danger">Cancelada</span>';
        default: return '<span class="text-gray">Desconhecido</span>';
    }
}

function formatMoney(value) {
    // Formata um valor numérico para o padrão monetário brasileiro (ponto como separador de milhar e vírgula como separador decimal)
    return value.toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    });
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        displayNotas(filteredNotas);
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(filteredNotas.length / NOTES_PER_PAGE);
    if (currentPage < totalPages) {
        currentPage++;
        displayNotas(filteredNotas);
    }
}

async function exportToPDF() {
    elements.exportModal.classList.add('hidden');
    elements.exportModal.classList.remove('flex');

    if (notas.length === 0) {
        showAlert.warning("Nenhuma nota para exportar. Por favor, importe arquivos XML primeiro.");
        return;
    }

    try {
        showAlert.loading("Gerando PDF...");

        const includeDashboard = elements.exportDashboard.checked;
        const includeTable = elements.exportTable.checked;

        const docContent = [];

        // Cabeçalho
        docContent.push(
            { text: 'Relatório de Notas Fiscais', style: 'header', alignment: 'center' },
            { text: `Empresa: ${elements.empresaNome.textContent}`, style: 'subheader', alignment: 'center' },
            { text: `Competência: ${elements.competencia.textContent}`, style: 'subheader', alignment: 'center' },
            { text: '\n' }
        );

        // Dashboard (cards + gráficos)
        if (includeDashboard) {
            // Adiciona os cards com valores
            docContent.push(
                {
                    columns: [
                        { text: `Valor Total:\nR$ ${document.getElementById('valor-total').textContent}`, style: 'dashboard' },
                        { text: `Total de Impostos:\nR$ ${document.getElementById('valor-impostos').textContent}`, style: 'dashboard' },
                        { text: `Notas Normais:\n${document.getElementById('notas-normais').textContent}`, style: 'dashboard' },
                        { text: `Notas Canceladas:\n${document.getElementById('notas-canceladas').textContent}`, style: 'dashboard' }
                    ]
                },
                { text: '\n' }
            );

            // Captura os gráficos como imagens
            const taxesChartImage = taxesChart.toBase64Image();
            const statusChartImage = statusChart.toBase64Image();

            // Insere os gráficos no PDF
            docContent.push(
                {
                    image: taxesChartImage,
                    width: 450,
                    alignment: 'center',
                    margin: [0, 10, 0, 10]
                },
                {
                    image: statusChartImage,
                    width: 450,
                    alignment: 'center',
                    margin: [0, 10, 0, 20]
                }
            );
            
            // gráfico de apuração
            
            if (!document.getElementById('apuracaoChartContainer').classList.contains('hidden')) {
            const apuracaoChartImage = apuracaoChart.toBase64Image();
            docContent.push(
                {
                    image: apuracaoChartImage,
                    width: 450,
                    alignment: 'center',
                    margin: [0, 10, 0, 20]
                }
            );
        }
            
            
        }

        // Tabela de Notas
        if (includeTable) {
            const tableBody = [
                [
                    'Número', 'Data', 'Tomador', 'CNPJ/CPF', 'Valor Total', 'ISS',
                    'ISS Retido', 'IR', 'PIS', 'COFINS', 'CSLL', 'INSS', 'Status'
                ]
            ];

            filteredNotas.forEach(nota => {
                tableBody.push([
                    nota.numero,
                    formatDate(nota.dataEmissao),
                    nota.razaoSocial,
                    formatCNPJ(nota.cnpj),
                    `R$ ${formatMoney(nota.valorNota)}`,
                    `R$ ${formatMoney(nota.iss)}`,
                    `R$ ${formatMoney(nota.issRetido)}`,
                    `R$ ${formatMoney(nota.ir)}`,
                    `R$ ${formatMoney(nota.pis)}`,
                    `R$ ${formatMoney(nota.cofins)}`,
                    `R$ ${formatMoney(nota.csll)}`,
                    `R$ ${formatMoney(nota.inss)}`,
                    nota.status === "1" ? "Normal" : "Cancelada"
                ]);
            });

            docContent.push({
                table: {
                    headerRows: 1,
                    widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                    body: tableBody
                },
                layout: 'lightHorizontalLines'
            });
        }

        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');

        const docDefinition = {
            content: docContent,
            footer: function (currentPage, pageCount) {
                return {
                    columns: [
                        { text: `Relatório gerado em ${dateStr} às ${timeStr}`, alignment: 'left', margin: [40, 0, 0, 0], fontSize: 8, color: 'gray' },
                        { text: `Página ${currentPage} de ${pageCount}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 8, color: 'gray' }
                    ]
                };
            },
            styles: {
                header: {
                    fontSize: 16,
                    bold: true,
                    color: '#2a5bd7'
                },
                subheader: {
                    fontSize: 10,
                    color: '#6c757d'
                },
                dashboard: {
                    fontSize: 10,
                    bold: true,
                    margin: [0, 0, 0, 10]
                }
            },
            defaultStyle: {
                fontSize: 9
            },
            pageOrientation: 'landscape'
        };

        pdfMake.createPdf(docDefinition).download(`relatorio-NFS-e-${dateStr.replace(/\//g, '-')}.pdf`);

        showAlert.close();
        showAlert.success("PDF exportado com sucesso!");

    } catch (error) {
        console.error("Erro ao exportar PDF:", error);
        showAlert.close();
        showAlert.error("Ocorreu um erro ao gerar o PDF.");
    }
}

function corrigirMunicipios(notasInvalidas) {
    const novoCodigo = '1100205';
    
    notas.forEach(nota => {
        if (notasInvalidas.includes(nota.numero)) {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(nota.xml, "text/xml");
                
                // Encontra e corrige o CodigoMunicipio do tomador
                const tomador = xmlDoc.getElementsByTagName("TomadorServico")[0];
                if (tomador) {
                    const endereco = tomador.getElementsByTagName("Endereco")[0];
                    if (endereco) {
                        const codigoMunicipio = endereco.getElementsByTagName("CodigoMunicipio")[0];
                        if (codigoMunicipio) {
                            codigoMunicipio.textContent = novoCodigo;
                            
                            // Atualiza a nota no array
                            nota.xml = new XMLSerializer().serializeToString(xmlDoc);
                            
                            // Atualiza a exibição do município
                            const municipioElement = endereco.getElementsByTagName("Municipio")[0];
                            const ufElement = endereco.getElementsByTagName("Uf")[0];
                            nota.municipioTomador = formatMunicipio(
                                novoCodigo,
                                municipioElement?.textContent.trim(),
                                ufElement?.textContent.trim()
                            );
                        }
                    }
                }
            } catch (error) {
                console.error(`Erro ao corrigir nota ${nota.numero}:`, error);
            }
        }
    });
    
    // Atualiza a exibição
    filterNotas();
}

function exportarXmlCorrigido(notasInvalidas) {
    try {
        // Criar um novo XML com todas as notas corrigidas
        let xmlCompleto = '<?xml version="1.0" encoding="UTF-8"?><ListaNfse>';
        
        notas.forEach(nota => {
            if (notasInvalidas.includes(nota.numero)) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(nota.xml, "text/xml");
                const tomador = xmlDoc.getElementsByTagName("TomadorServico")[0];
                
                if (tomador) {
                    const endereco = tomador.getElementsByTagName("Endereco")[0];
                    if (endereco) {
                        const codigoMunicipio = endereco.getElementsByTagName("CodigoMunicipio")[0];
                        if (codigoMunicipio && codigoMunicipio.textContent === '0') {
                            codigoMunicipio.textContent = '1100205';
                        }
                    }
                }
                
                xmlCompleto += new XMLSerializer().serializeToString(xmlDoc.documentElement);
            }
        });
        
        xmlCompleto += '</ListaNfse>';
        
        // Criar blob e fazer download
        const blob = new Blob([xmlCompleto], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `notas_corrigidas_${new Date().toISOString().slice(0,10)}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showAlert.success('XML corrigido exportado com sucesso!');
    } catch (error) {
        console.error('Erro ao exportar XML corrigido:', error);
        showAlert.error('Ocorreu um erro ao exportar o XML corrigido.');
    }
}

function cancelNoteEditing() {
  const editBtn = document.getElementById('editNoteBtn');
  const saveBtn = document.getElementById('saveNoteBtn');
  const cancelBtn = document.getElementById('cancelEditBtn');
  const exportBtn = document.getElementById('exportXmlBtn');

  // Gerenciar visibilidade dos botões
  editBtn.classList.remove('hidden');
  saveBtn.classList.add('hidden');
  cancelBtn.classList.add('hidden');

  // Remove estilo vermelho do botão Cancelar e volta ao neutro
  cancelBtn.classList.remove('bg-red-600', 'hover:bg-red-700', 'focus:ring-red-500');
  cancelBtn.classList.add('bg-gray-500', 'hover:bg-gray-600', 'focus:ring-gray-500');

  cancelBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  cancelBtn.disabled = false;

  // Ativa o botão Exportar XML
  exportBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  exportBtn.disabled = false;

  // Restaura os campos para modo leitura com os valores originais
  const inputs = document.querySelectorAll('#noteDetailContent input');
  inputs.forEach(input => {
    const originalId = input.dataset.originalId;
    const originalValue = input.getAttribute('data-original-value'); // Valor salvo antes da edição

    const span = document.createElement('span');
    span.id = originalId;
    span.className = 'editable-field cursor-pointer px-1 rounded hover:bg-primary-light transition-colors duration-200';
    span.textContent = originalValue;

    input.parentNode.replaceChild(span, input);
  });
}

function addFilterCondition() {
  const index = Date.now(); // ID único
  const container = document.createElement('div');
  container.className = 'flex flex-wrap gap-[10px] items-center bg-light-gray p-2 rounded-[5px] relative';
  container.dataset.index = index;

  container.innerHTML = `
    <select class="filter-column p-[8px] border border-light-gray rounded bg-white" aria-label="Coluna">
      <option value="">Coluna</option>
      <option value="numero">Número</option>
      <option value="dataEmissao">Data</option>
      <option value="valorNota">Valor Total</option>
      <option value="razaoSocial">Tomador</option>
    </select>
    <select class="filter-operator p-[8px] border border-light-gray rounded bg-white" aria-label="Operador">
      <option value="eq">Igual</option>
      <option value="ne">Diferente</option>
      <option value="contains">Contém</option>
      <option value="starts">Começa com</option>
      <option value="ends">Termina com</option>
      <option value="gt">Maior que</option>
      <option value="lt">Menor que</option>
      <option value="between">Entre</option>
      <option value="empty">É vazio</option>
      <option value="notempty">Não é vazio</option>
    </select>
    <input type="text" class="filter-value1 p-[8px] border border-light-gray rounded bg-white" placeholder="Valor 1" />
    <input type="text" class="filter-value2 p-[8px] border border-light-gray rounded bg-white hidden" placeholder="Valor 2" />
    <button onclick="removeFilterCondition(${index})" class="text-danger hover:text-red-700" title="Remover condição">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Evento para mostrar segundo input se operador for "between"
  container.querySelector('.filter-operator').addEventListener('change', function () {
    const v2 = container.querySelector('.filter-value2');
    v2.classList.toggle('hidden', this.value !== 'between');
  });

  document.getElementById('filterList').appendChild(container);
}

function removeFilterCondition(index) {
  const container = document.querySelector(`#filterList div[data-index="${index}"]`);
  if (container) container.remove();
}
function getAllFilterConditions() {
  const conditions = [];
  document.querySelectorAll('#filterList > div').forEach(div => {
    const column = div.querySelector('.filter-column')?.value;
    const operator = div.querySelector('.filter-operator')?.value;
    const val1 = div.querySelector('.filter-value1')?.value.trim();
    const val2 = div.querySelector('.filter-value2')?.value.trim();

    if (column && operator) {
      conditions.push({ column, operator, val1, val2 });
    }
  });
  return conditions;
}

function buildFilterSummary(conditions) {
  const summary = document.getElementById('activeFiltersSummary');
  if (!conditions || conditions.length === 0) {
    summary.textContent = '';
    return;
  }

  const lines = conditions.map(cond => {
    const label = OPERATORS_LABELS[cond.operator] || cond.operator;
    const val = cond.operator === 'between'
      ? `entre "${cond.val1}" e "${cond.val2}"`
      : cond.operator === 'empty' || cond.operator === 'notempty'
        ? ''
        : `"${cond.val1}"`;

    return `• ${cond.column}: ${label} ${val}`;
  });

  summary.innerHTML = `<strong>Filtros ativos:</strong><br>` + lines.map(sanitizeInput).join('<br>');
}

function clearAllFilters() {
  document.getElementById('filterList').innerHTML = '';
  document.getElementById('activeFiltersSummary').textContent = '';
  filteredNotas = notas;
  displayNotas(filteredNotas);
  updateDashboard(filteredNotas);
}

function isDateColumn(column) {
  return ['dataEmissao'].includes(column);
}

function parseDateSmart(input) {
  const formats = ['DD/MM/YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD'];
  for (let fmt of formats) {
    const date = dayjs(input, fmt, true);
    if (date.isValid()) return date.toDate();
  }
  return null;
}

function sanitizeInput(value) {
  return value.replace(/[&<>"']/g, function (c) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    })[c];
  });
}

const OPERATORS_LABELS = {
  eq: 'é igual a',
  ne: 'é diferente de',
  contains: 'contém',
  starts: 'começa com',
  ends: 'termina com',
  gt: 'maior que',
  lt: 'menor que',
  between: 'entre',
  empty: 'está vazio',
  notempty: 'não está vazio'
};

function applyAdvancedFilter() {
  const conditions = getAllFilterConditions();
  const hasComposedFilters = conditions.length > 0;

  if (!hasComposedFilters) {
    // fallback para filtro rápido (modo antigo)
    const column = document.getElementById('advancedColumn').value;
    const operator = document.getElementById('advancedOperator').value;
    const val1 = document.getElementById('advancedValue1').value.trim();
    const val2 = document.getElementById('advancedValue2').value.trim();

    if (!column || !operator || (!val1 && operator !== 'empty' && operator !== 'notempty')) {
      buildFilterSummary([]);
      return;
    }

    conditions.push({ column, operator, val1, val2 });
  }

  // Aplicar todos os filtros sobre o filteredNotas existente
  filteredNotas = filteredNotas.filter(nota => {
    return conditions.every(({ column, operator, val1, val2 }) => {
      const rawValue = nota[column];
      if (rawValue === undefined || rawValue === null) return false;

      let value = rawValue;

      // Datas
      if (isDateColumn(column)) {
        const dataNota = parseDateSmart(value);
        const d1 = parseDateSmart(val1);
        const d2 = parseDateSmart(val2);

        if (!dataNota || (operator !== 'empty' && operator !== 'notempty' && !d1)) return false;

        switch (operator) {
          case 'eq': return dataNota.toDateString() === d1.toDateString();
          case 'ne': return dataNota.toDateString() !== d1.toDateString();
          case 'gt': return dataNota > d1;
          case 'lt': return dataNota < d1;
          case 'between': return dataNota >= d1 && dataNota <= d2;
          case 'empty': return !value;
          case 'notempty': return !!value;
          default: return false;
        }
      }

      // Números
      if (typeof value === 'number') {
        const n1 = parseFloat(val1.replace(',', '.'));
        const n2 = parseFloat(val2.replace(',', '.'));
        if (isNaN(n1) && operator !== 'empty' && operator !== 'notempty') return false;

        switch (operator) {
          case 'eq': return value === n1;
          case 'ne': return value !== n1;
          case 'gt': return value > n1;
          case 'lt': return value < n1;
          case 'between': return value >= n1 && value <= n2;
          case 'empty': return value === 0;
          case 'notempty': return value !== 0;
          default: return false;
        }
      }

      // Textos
      if (typeof value === 'string') {
        const txt = value.toLowerCase();
        const v1 = val1.toLowerCase();

        switch (operator) {
          case 'eq': return txt === v1;
          case 'ne': return txt !== v1;
          case 'contains': return txt.includes(v1);
          case 'starts': return txt.startsWith(v1);
          case 'ends': return txt.endsWith(v1);
          case 'empty': return !txt.trim();
          case 'notempty': return !!txt.trim();
          default: return false;
        }
      }

      return false;
    });
  });

  buildFilterSummary(conditions);
}

// implementação de gráfico de apuração


function toggleApuramento() {
    try {
        console.log('Função toggleApuramento chamada'); // Debug
        const container = document.getElementById('apuracaoChartContainer');
        if (!container) {
            console.error('Elemento apuracaoChartContainer não encontrado');
            return;
        }
        console.log('Elemento encontrado, classe atual:', container.className); // Debug
        container.classList.toggle('hidden');
        
        if (!container.classList.contains('hidden')) {
            console.log('Criando gráfico de apuração'); // Debug
            createApuramentoChart();
        }
    } catch (error) {
        console.error('Erro em toggleApuramento:', error);
    }
}

function createApuramentoChart() {
    if (apuracaoChart) {
        apuracaoChart.destroy();
    }
    
    // Calcular totais
    const totalValorNotas = filteredNotas.reduce((sum, nota) => sum + nota.valorNota, 0);
    const totalPIS = filteredNotas.reduce((sum, nota) => sum + nota.pis, 0);
    const totalCOFINS = filteredNotas.reduce((sum, nota) => sum + nota.cofins, 0);
    const totalIR = filteredNotas.reduce((sum, nota) => sum + nota.ir, 0);
    const totalCSLL = filteredNotas.reduce((sum, nota) => sum + nota.csll, 0);
    
    // Calcular valores presumidos
    const basePresumida = totalValorNotas * 0.32; // Base de 32% para IRPJ e CSLL
    
    // PIS e COFINS
    const pisPresumido = (totalValorNotas * 0.65) / 100;
    const cofinsPresumido = (totalValorNotas * 3) / 100;
    
    // IRPJ e CSLL
    const irpjPresumido = basePresumida * 0.15; // 15% sobre a base
    const csllPresumido = basePresumida * 0.09; // 9% sobre a base
    
    // Calcular diferença (o que falta pagar)
    const pisLiquidado = pisPresumido - totalPIS;
    const cofinsLiquidado = cofinsPresumido - totalCOFINS;
    const irpjLiquidado = irpjPresumido - totalIR;
    const csllLiquidado = csllPresumido - totalCSLL;
    
    const ctx = document.getElementById('apuracaoChart').getContext('2d');
    const data = {
        labels: ['ISS', 'ISS Retido', 'IR', 'CSRF', 'INSS', 'PIS', 'COFINS', 'IRPJ', 'CSLL'],
        datasets: [{
            label: 'Valor (R$)',
            data: [
                filteredNotas.reduce((sum, nota) => sum + nota.iss, 0),
                filteredNotas.reduce((sum, nota) => sum + nota.issRetido, 0),
                filteredNotas.reduce((sum, nota) => sum + nota.ir, 0),
                filteredNotas.reduce((sum, nota) => sum + nota.pis + nota.cofins + nota.csll, 0),
                filteredNotas.reduce((sum, nota) => sum + nota.inss, 0),
                pisLiquidado,
                cofinsLiquidado,
                irpjLiquidado,
                csllLiquidado
            ],
            backgroundColor: [
                '#4caf50', // Verde para ISS
                '#2a5bd7', // Azul para ISS Retido
                '#ff9800', // Laranja para IR
                '#9c27b0', // Roxo para CSRF
                '#607d8b', // Cinza azulado para INSS
                '#f44336', // Vermelho para PIS
                '#3f51b5', // Azul escuro para COFINS
                '#795548', // Marrom para IRPJ
                '#009688'  // Teal para CSLL
            ]
        }]
    };
    
    apuracaoChart = new Chart(ctx, {
        type: 'bar',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Apuração - Lucro Presumido',
                    color: '#333',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `R$ ${context.raw.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}
