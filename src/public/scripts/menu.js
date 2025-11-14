document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButton = document.querySelector('.mobile-menu');
    const menuItems = document.querySelector('.menu-items');
    const body = document.body;
    
    if (mobileMenuButton && menuItems) {
        mobileMenuButton.addEventListener('click', function() {
            menuItems.classList.toggle('active');
            
            body.classList.toggle('menu-open');
            
            const icon = this.querySelector('.material-symbols-outlined');
            if (menuItems.classList.contains('active')) {
                icon.textContent = 'close';
            } else {
                icon.textContent = 'menu';
            }
        });

        const menuLinks = menuItems.querySelectorAll('a');
        for(const link of menuLinks){
            link.addEventListener('click', function() {
                menuItems.classList.remove('active');
                body.classList.remove('menu-open');
                const icon = mobileMenuButton.querySelector('.material-symbols-outlined');
                icon.textContent = 'menu';
            });
        };

        document.addEventListener('click', function(event) {
            if (!event.target.closest('.menu') && !event.target.closest('.mobile-menu')) {
                if (menuItems.classList.contains('active')) {
                    menuItems.classList.remove('active');
                    body.classList.remove('menu-open');
                    const icon = mobileMenuButton.querySelector('.material-symbols-outlined');
                    icon.textContent = 'menu';
                }
            }
        });
    }
});
