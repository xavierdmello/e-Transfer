import { Button, Center, UnorderedList, ListItem, VStack, Box, Flex, Text, Divider, Link } from "@chakra-ui/react";
import { usePrivy } from "@privy-io/react-auth";

function LandingPage() {
  const { login, authenticated, logout } = usePrivy();

  return (
    <VStack backgroundColor={"white"} padding={"16px"} height={"100%"} borderRadius={"3xl"} justifyContent={"space-between"} overflow={"hidden"}>
      <Box>
        <Text fontWeight={"bold"} fontSize={"2xl"} mb={"5px"}>
          Interac e-Transfer 💸
        </Text>
        <Text fontWeight={"semibold"} fontSize={"xl"} mb={"15px"}>
          Solid Financial Infrastructure for Everyone
        </Text>

        <UnorderedList spacing={4}>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              Send money instantly to <i>any</i> e-mail 📧
            </Text>
          </ListItem>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              Works with your bank account or crypto wallet 🏦
            </Text>
          </ListItem>
          <ListItem>
            <Text fontSize={"xl"} fontWeight={"semibold"}>
              As easy as Zelle. The new standard of friendly Web3 UX ✨
            </Text>
          </ListItem>
        </UnorderedList>
      </Box>

      <Flex w="100%" direction={"column"} gap={"10px"}>
        <Center>
          <Text fontSize={"sm"} color={"gray.400"}>
            What are you waiting for?
          </Text>
        </Center>
        <Divider h="1px" backgroundColor={"gray.200"} orientation="horizontal" />
        {authenticated === true ? <Button onClick={logout}>Logout</Button> : <Button onClick={login}>Login</Button>}
        <Center>
          <Text fontSize={"sm"} color={"gray.400"}>
            <Link isExternal href="https://github.com/xavierdmello/e-Transfer">
              Github
            </Link>{" "}
            - © 2023 <Link href="https://xavierdmello.com" isExternal>Xavier D'Mello</Link>
          </Text>
        </Center>
      </Flex>
    </VStack>
  );
}

export default LandingPage;
