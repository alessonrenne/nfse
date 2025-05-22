// Configurações
const NOTES_PER_PAGE = 10;
let currentPage = 1;
let notas = [];
let filteredNotas = [];
let currentSort = { column: null, direction: 'asc' };
let taxesChart = null;
let statusChart = null;

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
    dashboard: document.getElementById("dashboard")
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
    // Upload de arquivos
    elements.xmlInput.addEventListener("change", handleFiles);
    
    // Filtros
    elements.statusFilter.addEventListener("change", filterNotas);
    elements.numeroFilter.addEventListener("input", filterNotas);
    
    // Exportação
    elements.exportExcel.addEventListener("click", exportToExcel);
    elements.exportPDF.addEventListener("click", showExportModal);
    elements.confirmExportPDF.addEventListener("click", exportToPDF);
    
    // Paginação
    elements.prevPage.addEventListener("click", goToPrevPage);
    elements.nextPage.addEventListener("click", goToNextPage);
    
    // Modal
    elements.closeModal.addEventListener("click", () => {
        elements.warningModal.classList.add('hidden');
        elements.warningModal.classList.remove('flex');
    });
    elements.understandBtn.addEventListener("click", () => {
        elements.warningModal.classList.add('hidden');
        elements.warningModal.classList.remove('flex');
    });
    elements.closeExportModal.addEventListener("click", () => {
        elements.exportModal.classList.add('hidden');
        elements.exportModal.classList.remove('flex');
    });
    elements.cancelExport.addEventListener("click", () => {
        elements.exportModal.classList.add('hidden');
        elements.exportModal.classList.remove('flex');
    });
    
    // Detalhes da nota
    elements.closeDetail.addEventListener("click", () => {
        elements.noteDetail.classList.add('hidden');
    });
    
    // Dropzone
    elements.dropzone.addEventListener("click", () => elements.xmlInput.click());
    elements.dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        elements.dropzone.classList.add("active");
    });
    elements.dropzone.addEventListener("dragleave", () => {
        elements.dropzone.classList.remove("active");
    });
    elements.dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        elements.dropzone.classList.remove("active");
        elements.xmlInput.files = e.dataTransfer.files;
        handleFiles({ target: elements.xmlInput });
    });
    
    // Ordenação da tabela
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => {
            const column = header.getAttribute('data-sort');
            sortTable(column);
        });
    });
}

function showExportModal() {
    if (notas.length === 0) {
        showAlert.warning("Nenhuma nota para exportar. Por favor, importe arquivos XML primeiro.");
        return;
    }
    elements.exportModal.classList.remove('hidden');
    elements.exportModal.classList.add('flex');
}

function showLoading(show) {
    if (show) {
        // Usar SweetAlert2 para mostrar o carregamento
        showAlert.loading("Processando arquivos...");
    } else {
        // Fechar o alerta de carregamento
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
        const readerPromises = Array.from(files).map(file => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => {
                    try {
                        const parser = new DOMParser();
                        const xml = parser.parseFromString(e.target.result, "application/xml");
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

            // Extrai nome do prestador
            if (!nomePrestador && prestador) {
                nomePrestador = get(prestador, "RazaoSocial");
                elements.empresaNome.textContent = nomePrestador || 'a empresa';
            }

            const numero = get(inf, "Numero");
            const status = get(inf, "Status");
            const dataEmissao = get(inf, "DataEmissao");

            // Define competência
            if (lista.length === 0 && dataEmissao) {
                const competencia = new Date(dataEmissao).toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'});
                elements.competencia.textContent = competencia;
            }

            const razaoSocial = get(tomador, "RazaoSocial");
            const cnpj = get(tomador, "Cnpj") || get(tomador, "Cpf");

            // PRIORIZA ValoresNfse quando disponível
            const valorNota = parseFloat(
                get(valoresNfse, "BaseCalculo") || 
                get(valoresServico, "ValorServicos") || 
                0
            );
            
            // PRIORIZA ValoresNfse > ValorIss primeiro
            const valorIss = parseFloat(
                get(valoresNfse, "ValorIss") || 
                get(valoresServico, "ValorIss") || 
                0
            );

            const ir = parseFloat(get(valoresServico, "ValorIr")) || 0;
            const pis = parseFloat(get(valoresServico, "ValorPis")) || 0;
            const cofins = parseFloat(get(valoresServico, "ValorCofins")) || 0;
            const csll = parseFloat(get(valoresServico, "ValorCsll")) || 0;

            const issRetidoTag = get(servico, "IssRetido");
            const issRetido = issRetidoTag === "1" ? valorIss : 0;
            const issNormal = issRetidoTag === "2" ? valorIss : 0;
            const valorInss = parseFloat(get(valoresServico, "ValorInss")) || 0;

            lista.push({
                numero,
                dataEmissao,
                razaoSocial,
                cnpj,
                valorNota,
                iss: issNormal,
                issRetido,
                ir,
                pis,
                cofins,
                csll,
                inss: valorInss,
                status,
                xml: new XMLSerializer().serializeToString(comp)
            });
        } catch (e) {
            console.warn("Erro ao processar nota:", e);
        }
    }
    return lista;
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
    
    // Atualizar controles de paginação
    elements.prevPage.disabled = currentPage <= 1;
    elements.nextPage.disabled = currentPage >= totalPages;
    elements.pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    elements.pagination.classList.remove('hidden');
    
    // Preencher tabela
    paginatedData.forEach(nota => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-primary hover:bg-opacity-5";
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
                <button class="text-primary hover:text-primary-dark" onclick="viewNoteDetail('${nota.numero}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewNoteDetail(numero) {
    const nota = notas.find(n => n.numero === numero);
    if (!nota) return;
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(nota.xml, "text/xml");
    
    let prettyXml = '';
    try {
        // Format XML for display
        const serializer = new XMLSerializer();
        const xmlText = serializer.serializeToString(xmlDoc);
        prettyXml = formatXML(xmlText);
    } catch (error) {
        console.error("Erro ao formatar XML:", error);
        prettyXml = nota.xml;
    }
    
    elements.noteDetailContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-[20px] mb-[40px]">
            <div>
                <h3 class="text-primary mb-[10px]">Informações da Nota</h3>
                <p><strong>Número:</strong> ${nota.numero}</p>
                <p><strong>Data Emissão:</strong> ${formatDate(nota.dataEmissao)}</p>
                <p><strong>Status:</strong> ${formatStatus(nota.status)}</p>
                <p><strong>Valor:</strong> R$ ${formatMoney(nota.valorNota)}</p>
            </div>
            <div>
                <h3 class="text-primary mb-[10px]">Tomador</h3>
                <p><strong>Nome:</strong> ${nota.razaoSocial}</p>
                <p><strong>CNPJ/CPF:</strong> ${formatCNPJ(nota.cnpj)}</p>
            </div>
        </div>
        <div>
            <h3 class="text-primary mb-[10px]">Impostos</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-[20px] mb-[40px]">
                <div class="bg-white p-[10px] rounded-[10px] shadow-sm border border-light-gray">
                    <p class="text-gray text-[0.8rem]">ISS</p>
                    <p class="font-bold">R$ ${formatMoney(nota.iss)}</p>
                </div>
                <div class="bg-white p-[10px] rounded-[10px] shadow-sm border border-light-gray">
                    <p class="text-gray text-[0.8rem]">ISS Retido</p>
                    <p class="font-bold">R$ ${formatMoney(nota.issRetido)}</p>
                </div>
                <div class="bg-white p-[10px] rounded-[10px] shadow-sm border border-light-gray">
                    <p class="text-gray text-[0.8rem]">IR</p>
                    <p class="font-bold">R$ ${formatMoney(nota.ir)}</p>
                </div>
                <div class="bg-white p-[10px] rounded-[10px] shadow-sm border border-light-gray">
                    <p class="text-gray text-[0.8rem]">PIS</p>
                    <p class="font-bold">R$ ${formatMoney(nota.pis)}</p>
                </div>
                <div class="bg-white p-[10px] rounded-[10px] shadow-sm border border-light-gray">
                    <p class="text-gray text-[0.8rem]">COFINS</p>
                    <p class="font-bold">R$ ${formatMoney(nota.cofins)}</p>
                </div>
                <div class="bg-white p-[10px] rounded-[10px] shadow-sm border border-light-gray">
                    <p class="text-gray text-[0.8rem]">CSLL</p>
                    <p class="font-bold">R$ ${formatMoney(nota.csll)}</p>
                </div>
                <div class="bg-white p-[10px] rounded-[10px] shadow-sm border border-light-gray">
                    <p class="text-gray text-[0.8rem]">INSS</p>
                    <p class="font-bold">R$ ${formatMoney(nota.inss)}</p>
                </div>
            </div>
        </div>
        <div>
            <h3 class="text-primary mb-[10px]">XML</h3>
            <pre class="bg-light-gray p-[10px] rounded-[10px] overflow-x-auto text-[0.8rem] max-h-[300px]">${escapeHTML(prettyXml)}</pre>
        </div>
    `;
    
    elements.noteDetail.classList.remove('hidden');
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
                        text: 'Distribuição de Impostos',
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
}

function filterNotas() {
    const numeroFilter = elements.numeroFilter.value.toLowerCase();
    const statusFilter = elements.statusFilter.value;
    
    filteredNotas = notas.filter(nota => {
        const matchesNumero = nota.numero.toLowerCase().includes(numeroFilter);
        const matchesStatus = statusFilter === "todos" || nota.status === statusFilter;
        return matchesNumero && matchesStatus;
    });
    
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

function exportToExcel() {
    if (notas.length === 0) {
        showAlert.warning("Nenhuma nota para exportar. Por favor, importe arquivos XML primeiro.");
        return;
    }
    
    try {
        // Mostrar animação de carregamento
        showAlert.loading("Gerando arquivo Excel...");
        
        // Verificar se a biblioteca está carregada
        if (typeof XLSX === 'undefined') {
            showAlert.info("Biblioteca para exportação Excel ainda não carregada. Por favor, tente novamente em alguns segundos.");
            return;
        }
        
        const worksheet = XLSX.utils.json_to_sheet(
            filteredNotas.map(nota => ({
                'Número': nota.numero,
                'Data': formatDate(nota.dataEmissao),
                'Tomador': nota.razaoSocial,
                'CNPJ/CPF': formatCNPJ(nota.cnpj),
                'Valor Total': formatMoney(nota.valorNota),
                'ISS': formatMoney(nota.iss),
                'ISS Retido': formatMoney(nota.issRetido),
                'IR': formatMoney(nota.ir),
                'PIS': formatMoney(nota.pis),
                'COFINS': formatMoney(nota.cofins),
                'CSLL': formatMoney(nota.csll),
                'INSS': formatMoney(nota.inss),
                'Status': nota.status === "1" ? "Normal" : "Cancelada"
            }))
        );
        
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Notas Fiscais");
        
        // Formato de data para o nome do arquivo
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR').replace(/\//g, '-');
        const fileName = `notas-fiscais-${elements.empresaNome.textContent.replace(/\s+/g, '-')}-${dateStr}.xlsx`;
        
        XLSX.writeFile(workbook, fileName);
        
        // Fechar animação de carregamento
        showAlert.close();
        
        // Mostrar mensagem de sucesso
        showAlert.success(`Arquivo Excel exportado com sucesso! (${filteredNotas.length} notas)`);
    } catch (error) {
        console.error("Erro ao exportar para Excel:", error);
        showAlert.error("Ocorreu um erro ao exportar para Excel. Verifique o console para mais detalhes.");
    }
}

async function exportToPDF() {
    // Fechar modal de exportação
    elements.exportModal.classList.add('hidden');
    elements.exportModal.classList.remove('flex');
    
    // Verificar se temos notas para exportar
    if (notas.length === 0) {
        showAlert.warning("Nenhuma nota para exportar. Por favor, importe arquivos XML primeiro.");
        return;
    }
    
    try {
        // Mostrar indicador de carregamento animado com SweetAlert2
        showAlert.loading("Gerando PDF, isso pode levar alguns segundos...");
        
        // Verificar se as bibliotecas estão carregadas
        if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
            throw new Error("Bibliotecas de exportação não carregadas completamente");
        }
        
        // Criar objeto jsPDF com orientação paisagem para caber mais dados
        const pdf = new window.jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        // Define as opções de exportação
        const includeDashboard = elements.exportDashboard.checked;
        const includeTable = elements.exportTable.checked;
        
        let yOffset = 10; // Margem superior inicial
        
        // Adicionar cabeçalho
        pdf.setFontSize(18);
        pdf.setTextColor(42, 91, 215); // cor primária
        pdf.text('Relatório de Notas Fiscais', pdf.internal.pageSize.getWidth() / 2, yOffset, { align: 'center' });
        
        yOffset += 10;
        pdf.setFontSize(12);
        pdf.setTextColor(108, 117, 125); // cor cinza
        pdf.text(`Empresa: ${elements.empresaNome.textContent}`, pdf.internal.pageSize.getWidth() / 2, yOffset, { align: 'center' });
        
        yOffset += 7;
        pdf.text(`Competência: ${elements.competencia.textContent}`, pdf.internal.pageSize.getWidth() / 2, yOffset, { align: 'center' });
        
        yOffset += 7;
        
        // Capturar e adicionar dashboard se solicitado
        if (includeDashboard) {
            const dashboardElement = document.getElementById('dashboard');
            
            if (dashboardElement) {
                // Criar um clone do dashboard para evitar problemas de renderização
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'absolute';
                tempContainer.style.left = '-9999px';
                tempContainer.style.width = dashboardElement.offsetWidth + 'px';
                tempContainer.style.height = dashboardElement.offsetHeight + 'px';
                tempContainer.style.overflow = 'hidden';
                
                // Clone o dashboard sem eventos
                const dashboardClone = dashboardElement.cloneNode(true);
                tempContainer.appendChild(dashboardClone);
                document.body.appendChild(tempContainer);
                
                // Capturar o dashboard clonado com html2canvas com configurações otimizadas
                const dashboardCanvas = await html2canvas(dashboardClone, {
                    scale: 1.5, // Ajustado para melhor balancear qualidade e performance
                    allowTaint: true,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#FFFFFF',
                    imageTimeout: 0,
                    removeContainer: true
                });
                
                // Remover o contêiner temporário após captura
                document.body.removeChild(tempContainer);
                
                // Converter canvas para imagem e adicionar ao PDF
                const dashboardImgData = dashboardCanvas.toDataURL('image/png', 0.95);
                
                // Calcular dimensões para caber na página e manter proporção
                const pdfWidth = pdf.internal.pageSize.getWidth() - 20; // margens
                const pdfHeight = (dashboardCanvas.height * pdfWidth) / dashboardCanvas.width;
                
                // Ajustar a altura máxima para evitar distorção
                const maxHeight = 150; // altura máxima em mm para evitar compressão excessiva
                const finalHeight = Math.min(pdfHeight, maxHeight);
                
                pdf.addImage(dashboardImgData, 'PNG', 10, yOffset, pdfWidth, finalHeight);
                yOffset += finalHeight + 15;
            }
        }
        
        // Capturar e adicionar tabela se solicitado
        if (includeTable) {
            // Criar uma nova página se o dashboard foi incluído e ocupou muito espaço
            if (includeDashboard && yOffset > 150) {
                pdf.addPage();
                yOffset = 15;
            }
            
            // Configurações para a tabela de notas fiscais
            pdf.setFontSize(14);
            pdf.setTextColor(42, 91, 215); // cor primária
            pdf.text('Tabela de Notas Fiscais', 10, yOffset);
            yOffset += 10;
            
            // Definir cabeçalhos da tabela (reduzidos para melhor ajuste)
            const headers = [
                'Número', 'Data', 'Valor Total', 'ISS', 'ISS Retido', 'IR', 'Status'
            ];
            
            // Ajustar larguras das colunas para melhor aproveitamento da página em paisagem
            // Redimensionamos as colunas para evitar problemas de adaptação
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margins = 20; // 10mm de cada lado
            const availableWidth = pageWidth - margins;
            
            // Cálculo dinâmico das larguras de coluna baseado na largura disponível
            const colWidths = [
                availableWidth * 0.10, // Número
                availableWidth * 0.15, // Data
                availableWidth * 0.20, // Valor Total
                availableWidth * 0.13, // ISS
                availableWidth * 0.13, // ISS Retido
                availableWidth * 0.13, // IR
                availableWidth * 0.16  // Status
            ];
            
            const tableWidth = colWidths.reduce((a, b) => a + b, 0);
            const startX = (pageWidth - tableWidth) / 2;
            
            // Estilo para cabeçalho
            pdf.setFillColor(233, 236, 239); // cor light-gray
            pdf.setDrawColor(233, 236, 239); // cor light-gray para bordas
            pdf.setTextColor(33, 37, 41); // cor dark para texto
            pdf.setFontSize(9); // Tamanho reduzido para melhor ajuste
            
            // Desenhar cabeçalho
            let currentX = startX;
            for (let i = 0; i < headers.length; i++) {
                pdf.setFillColor(233, 236, 239);
                pdf.rect(currentX, yOffset, colWidths[i], 10, 'F');
                pdf.text(headers[i], currentX + colWidths[i]/2, yOffset + 6, { align: 'center' });
                currentX += colWidths[i];
            }
            yOffset += 10;
            
            // Estilo para dados
            pdf.setDrawColor(233, 236, 239); // cor light-gray para bordas
            pdf.setTextColor(33, 37, 41); // cor dark para texto
            
            // Limite o número de registros para evitar problemas de memória e deixar a exportação mais rápida
            const notasToExport = filteredNotas.slice(0, 30); // Reduzimos para 30 para evitar sobrecarregar
            let oddRow = true;
            
            for (const nota of notasToExport) {
                // Verificar se precisamos de nova página
                if (yOffset > pdf.internal.pageSize.getHeight() - 20) {
                    pdf.addPage();
                    yOffset = 15;
                    
                    // Adicionar cabeçalho na nova página
                    pdf.setFontSize(14);
                    pdf.setTextColor(42, 91, 215);
                    pdf.text('Tabela de Notas Fiscais (continuação)', 10, yOffset);
                    yOffset += 10;
                    
                    // Redesenhar cabeçalho da tabela
                    currentX = startX;
                    pdf.setFillColor(233, 236, 239);
                    pdf.setTextColor(33, 37, 41);
                    pdf.setFontSize(9);
                    
                    for (let i = 0; i < headers.length; i++) {
                        pdf.rect(currentX, yOffset, colWidths[i], 10, 'F');
                        pdf.text(headers[i], currentX + colWidths[i]/2, yOffset + 6, { align: 'center' });
                        currentX += colWidths[i];
                    }
                    yOffset += 10;
                }
                
                // Alternar cores de fundo para melhor legibilidade
                if (oddRow) {
                    pdf.setFillColor(248, 249, 250); // cor light para linhas ímpares
                } else {
                    pdf.setFillColor(255, 255, 255); // cor branca para linhas pares
                }
                
                // Formatar dados adequadamente
                const rowData = [
                    nota.numero,
                    formatDate(nota.dataEmissao),
                    `R$ ${formatMoney(nota.valorNota)}`,
                    `R$ ${formatMoney(nota.iss)}`,
                    `R$ ${formatMoney(nota.issRetido)}`,
                    `R$ ${formatMoney(nota.ir)}`,
                    nota.status === "1" ? "Normal" : "Cancelada"
                ];
                
                // Desenhar células da linha
                currentX = startX;
                for (let i = 0; i < rowData.length; i++) {
                    pdf.rect(currentX, yOffset, colWidths[i], 8, 'F');
                    
                    // Verificar se o texto não é muito longo para a célula
                    const text = rowData[i];
                    const textWidth = pdf.getStringUnitWidth(text) * pdf.getFontSize() / pdf.internal.scaleFactor;
                    
                    if (textWidth > colWidths[i] - 4) { // margem de 2mm de cada lado
                        // Reduzir o texto se for muito longo
                        const maxChars = Math.floor((colWidths[i] - 4) * pdf.internal.scaleFactor / pdf.getFontSize() * (text.length / textWidth));
                        const shortenedText = text.substring(0, maxChars) + '...';
                        pdf.text(shortenedText, currentX + colWidths[i]/2, yOffset + 5, { align: 'center' });
                    } else {
                        pdf.text(text, currentX + colWidths[i]/2, yOffset + 5, { align: 'center' });
                    }
                    
                    currentX += colWidths[i];
                }
                
                yOffset += 8;
                oddRow = !oddRow;
            }
            
            // Adicionar nota de rodapé sobre as notas exibidas
            if (filteredNotas.length > 30) {
                yOffset += 5;
                pdf.setTextColor(108, 117, 125); // cor cinza
                pdf.setFontSize(8);
                pdf.text(`Nota: Exibindo apenas as primeiras 30 notas de um total de ${filteredNotas.length}. Exporte para Excel para ver a lista completa.`, 
                    pdf.internal.pageSize.getWidth() / 2, yOffset, { align: 'center' });
            }
        }
        
        // Adicionar rodapé com informações
        pdf.setFontSize(8);
        pdf.setTextColor(108, 117, 125); // cor cinza
        
        // Adicionar data de geração na última página
        const today = new Date();
        const dateStr = today.toLocaleDateString('pt-BR');
        const timeStr = today.toLocaleTimeString('pt-BR');
        
        pdf.text(`Relatório gerado em ${dateStr} às ${timeStr}`, 
            pdf.internal.pageSize.getWidth() - 10, pdf.internal.pageSize.getHeight() - 10, { align: 'right' });
        
        // Salvar o PDF
        const fileName = `notas-fiscais-${elements.empresaNome.textContent.replace(/\s+/g, '-')}-${dateStr.replace(/\//g, '-')}.pdf`;
        pdf.save(fileName);
        
        // Mostrar mensagem de sucesso com SweetAlert2
        showAlert.success(`PDF gerado com sucesso! (${fileName})`);
        
    } catch (error) {
        console.error("Erro ao exportar para PDF:", error);
        // Fechar o indicador de carregamento
        showAlert.close();
        // Mostrar mensagem de erro com SweetAlert2
        showAlert.error("Ocorreu um erro ao exportar para PDF: " + error.message);
    } finally {
        // Fechar qualquer indicador de carregamento pendente
        showAlert.close();
    }
}
